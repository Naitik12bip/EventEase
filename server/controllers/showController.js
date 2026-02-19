import axios from "axios";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";

// --- DUMMY DATA ---
const dummyShows = [
  {
    _id: "dummy1",
    movieId: "dummy1",
    showDateTime: new Date().toISOString(),
    showPrice: 250,
    occupiedSeats: [],
    movie: {
      _id: "dummy1", // Yeh field add karna zaroori hai
      title: "Test Movie (Database Khali Hai)",
      overview: "Admin panel se movie add karein.",
      poster_path: "https://via.placeholder.com/500x750?text=No+Poster",
      vote_average: 7,
      genres: [{ name: "Test" }],
      runtime: 120
    }
  }
];
// 1. GET ALL SHOWS (Database + Ticketmaster)
export const getShows = async (req, res) => {
  try {
    const TM_API_KEY = 'hOkJkATAyKr0GOmOrrAF0CkhilLZvcvw';
    const CITY = 'New York';

    const [dbShowsResult, tmResponseResult] = await Promise.allSettled([
      Show.find({}).populate('movie').sort({ showDateTime: 1 }),
      axios.get(`https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TM_API_KEY}&city=${CITY}&size=15`)
    ]);

    const movieShowsMap = new Map();

    // A. Database Data (Admin Panel se add ki hui movies)
    if (dbShowsResult.status === 'fulfilled' && dbShowsResult.value.length > 0) {
      dbShowsResult.value.forEach(show => {
        if (show.movie) {
          movieShowsMap.set(show.movie._id.toString(), {
            _id: show.movie._id.toString(),
            movieId: show.movie._id,
            showDateTime: show.showDateTime,
            showPrice: show.showPrice,
            occupiedSeats: show.occupiedSeats || [],
            movie: show.movie
          });
        }
      });
    }

    // B. Ticketmaster Data (Live Events)
    if (tmResponseResult.status === 'fulfilled' && tmResponseResult.value.data?._embedded) {
      tmResponseResult.value.data._embedded.events.forEach(event => {
        if (!movieShowsMap.has(event.id)) {
          const poster = event.images?.find(img => img.ratio === "2_3")?.url || event.images?.[0]?.url;
          movieShowsMap.set(event.id, {
            _id: event.id,
            movieId: event.id,
            showDateTime: event.dates?.start?.dateTime || new Date().toISOString(),
            showPrice: 200,
            occupiedSeats: [],
            movie: {
              id: event.id,
              title: event.name,
              overview: event.info || "Live Event",
              poster_path: poster,
              vote_average: 7,
              genres: [{ name: "Live Event" }]
            }
          });
        }
      });
    }

    let finalShows = Array.from(movieShowsMap.values());

    // C. Fallback: Agar dono jagah data nahi hai
    if (finalShows.length === 0) {
      finalShows = dummyShows;
    }

    res.json({ success: true, shows: finalShows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. ADD SHOW (Admin Logic)
export const addShow = async (req, res) => {
  try {
    const { movieId, showsInput, showPrice } = req.body;
    let movie = await Movie.findById(movieId);

    if (!movie) {
      // TMDB API use karni hai yahan, Ticketmaster ki nahi
      const TMDB_KEY = process.env.TMDB_API_KEY;
      const response = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_KEY}&append_to_response=credits`);

      const data = response.data;
      movie = await Movie.create({
        _id: movieId,
        title: data.title,
        overview: data.overview,
        poster_path: data.poster_path,
        backdrop_path: data.backdrop_path,
        genres: data.genres,
        casts: data.credits?.cast || [],
        release_date: data.release_date,
        vote_average: data.vote_average,
        runtime: data.runtime,
      });
    }

    const showsToCreate = showsInput.flatMap(s =>
      s.time.map(t => ({
        movie: movieId,
        showDateTime: new Date(`${s.date}T${t}`),
        showPrice,
        occupiedSeats: {}
      }))
    );

    if (showsToCreate.length > 0) await Show.insertMany(showsToCreate);

    res.json({ success: true, message: 'Show and Movie added successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. GET SINGLE SHOW
export const getShow = async (req, res) => {
  try {
    const { movieId } = req.params;
    console.log("Fetching details for ID:", movieId);

    // 1. Handle Dummy Data
    if (movieId === "dummy1") {
      return res.json({ 
        success: true, 
        movie: dummyShows[0].movie, 
        shows: dummyShows 
      });
    }

    // 2. Handle Real DB Data
    const movie = await Movie.findById(movieId);
    if (!movie) {
        // Agar DB mein nahi mili, toh ho sakta hai Ticketmaster ID ho
        // Yahan aap Ticketmaster fallback logic bhi daal sakte hain
        return res.status(404).json({ success: false, message: 'Movie details not found' });
    }

    const shows = await Show.find({ movie: movieId });

    res.json({ 
      success: true, 
      movie, 
      shows: shows || [] 
    });

  } catch (error) {
    console.error("Detail Fetch Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. GET NOW PLAYING (Search)
export const getNowPlayingMovies = async (req, res) => {
  try {
    const TMDB_KEY = process.env.TMDB_API_KEY;
    const { data } = await axios.get(`https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_KEY}`);
    res.json({ success: true, movies: data.results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

