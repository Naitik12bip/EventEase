import axios from "axios";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";

const saveShow = async (showData) => {
  try {
    // Destructure data from showData
    const { movie, showDateTime, showPrice, occupiedSeats } = showData;

    const newShow = new Show({
      movie,
      showDateTime,
      showPrice,
      occupiedSeats,
    });

    // Check if a show with the same movie and datetime already exists
    const existingShow = await Show.findOne({
      movie: newShow.movie,
      showDateTime: newShow.showDateTime
    });

    if (existingShow) {
      console.log('Show already exists:', existingShow);
      return existingShow; // Optionally return the existing show if you don't want duplicates
    }

    // Save the new show to the database
    const savedShow = await newShow.save();
    console.log('Show saved:', savedShow);
    return savedShow;
  } catch (err) {
    console.error('Error saving show:', err);
    throw err; // Rethrow the error to handle it higher up in the call stack
  }
};

export default saveShow;

// API to get now playing movies from TMDB
export const getNowPlayingMovies = async (req, res) => {
    try {
        const { data } = await axios.get("https://api.themoviedb.org/3/movie/now_playing", {
            headers: {
                Authorization: `Bearer ${process.env.TMDB_API_KEY}`
            },
        });

        const movies = data.results;
        res.json({ success: true, movies: movies });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message })
    }
}

//API to add a new show to the database 
export const addShow = async (req, res) => {
    try {
        const { movieId, showsInput, showPrice } = req.body;
        const numericMovieId = Number(movieId);

        let movie = await Movie.findById(numericMovieId);

        if (!movie) {
            // fetch movie details and credits from TMDB API
            const [movieDetailsResponse, movieCreditsResponse] = await Promise.all([
                axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
                    headers: {
                        Authorization: `Bearer ${process.env.TMDB_API_KEY}`
                    }
                }),
                axios.get(`https://api.themoviedb.org/3/movie/${movieId}/credits`, {
                    headers: {
                        Authorization: `Bearer ${process.env.TMDB_API_KEY}`
                    }
                }),
            ]);

            const movieApiData = movieDetailsResponse.data;
            const movieCreditsData = movieCreditsResponse.data;

            const movieDetails = {
                _id: numericMovieId,
                title: movieApiData.title,
                overview: movieApiData.overview,
                poster_path: movieApiData.poster_path,
                backdrop_path: movieApiData.backdrop_path,
                genres: movieApiData.genres,
                casts: movieCreditsData.cast,
                release_date: movieApiData.release_date,
                original_language: movieApiData.original_language,
                tagline: movieApiData.tagline || "",
                vote_average: movieApiData.vote_average,
                runtime: movieApiData.runtime,
            }

            // Corrected: Add movie to the database
            movie = await Movie.create(movieDetails);
        }

        if (showsInput && showsInput.length > 0) {
            const showToCreate = [];

            showsInput.forEach(show => {
                if (!show.time || !Array.isArray(show.time)) {
                    throw new Error(`Invalid time array for date ${show.date}`);
                }
                const showDate = show.date;
                show.time.forEach(time => {
                    const dateTimeString = `${showDate}T${time}`;
                    showToCreate.push({
                        movie: numericMovieId,
                        showDateTime: new Date(dateTimeString),
                        showPrice,
                        occupiedSeats: {}
                    });
                });
            });

            if (showToCreate.length > 0) {
                const shows = await Show.insertMany(showToCreate);
                console.log("Shows saved:", shows);
            }
        }

        res.json({ success: true, message: "Shows added successfully!" });

    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}

// API to get all shows from the database
export const getShows = async (req, res) => {
    try{ 
        const shows =  (await Show.find({showDateTime: {$gte: new Date()}}).populate('movie')).toSorted({ showDateTime: 1});

        // filter unique shows

        const uniqueShows = new Set(shows.map(show => show.movie));

        res.json({success: true, shows: Array.from(uniqueShows)});
    } catch(err){
        console.error(err);
        res.json({ success: false, message: err.message });
    }

}

// API to get a single show from the database
export const getShow = async (req, res) => {
    try{
        const { movieId } = req.params;
        //get all upcoming shows for the movie

        const shows = await  Show.find({movie: movieId, showDataTime: {$gte: new Date() }})
        const movie = await Movie.findById(movieId);
        const dateTime = {};

        shows.forEach((show)=> {
            const date = show.showDateTime.toISOString().split('T')[0];
            if(!dateTime[date]){
                dateTime[date] = [];
            }
            dateTime[date].push({time: show.showDateTime, showId: show._id});
        })
        res.json({ success: true, movie, dateTime });
    } catch(err){
        console.error(err);
        res.json({ success: false, message: err.message });
    }
}