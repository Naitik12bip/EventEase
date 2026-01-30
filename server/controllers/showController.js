import axios from "axios";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";

/* ----------------------------------
   SAVE SHOW (kept, structure unchanged)
----------------------------------- */
const saveShow = async (showData) => {
  try {
    const { movie, showDateTime, showPrice, occupiedSeats } = showData;

    const existingShow = await Show.findOne({
      movie,
      showDateTime
    });

    if (existingShow) {
      return existingShow;
    }

    const newShow = new Show({
      movie,
      showDateTime,
      showPrice,
      occupiedSeats
    });

    return await newShow.save();
  } catch (err) {
    console.error("Error saving show:", err);
    throw err;
  }
};

export default saveShow;

/* ----------------------------------
   GET NOW PLAYING MOVIES (TMDB)
----------------------------------- */
export const getNowPlayingMovies = async (req, res) => {
  try {
    const { data } = await axios.get(
      "https://api.themoviedb.org/3/movie/now_playing",
      {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
          accept: "application/json"
        }
      }
    );

    res.json({
      success: true,
      movies: data.results
    });
  } catch (error) {
    console.error("TMDB Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch now playing movies"
    });
  }
};

/* ----------------------------------
   ADD SHOW
----------------------------------- */
export const addShow = async (req, res) => {
  try {
    const { movieId, showsInput, showPrice } = req.body;

    const numericMovieId = Number(movieId);
    if (!Number.isInteger(numericMovieId)) {
      return res.status(400).json({
        success: false,
        message: "Valid numeric Movie ID is required"
      });
    }

    let movie = await Movie.findById(numericMovieId);

    if (!movie) {
      const [movieDetailsRes, movieCreditsRes] = await Promise.all([
        axios.get(`https://api.themoviedb.org/3/movie/${numericMovieId}`, {
          headers: {
            Authorization: `Bearer ${process.env.TMDB_API_KEY}`
          }
        }),
        axios.get(`https://api.themoviedb.org/3/movie/${numericMovieId}/credits`, {
          headers: {
            Authorization: `Bearer ${process.env.TMDB_API_KEY}`
          }
        })
      ]);

      const movieApiData = movieDetailsRes.data;
      const movieCreditsData = movieCreditsRes.data;

      movie = await Movie.create({
        _id: numericMovieId,
        title: movieApiData.title,
        overview: movieApiData.overview,
        poster_path: movieApiData.poster_path,
        backdrop_path: movieApiData.backdrop_path,
        genres: movieApiData.genres,
        casts: movieCreditsData.cast.slice(0, 10),
        release_date: movieApiData.release_date,
        original_language: movieApiData.original_language,
        tagline: movieApiData.tagline || "",
        vote_average: movieApiData.vote_average,
        runtime: movieApiData.runtime
      });
    }

    if (Array.isArray(showsInput) && showsInput.length > 0) {
      const showToCreate = [];

      showsInput.forEach((show) => {
        if (!show.date || !Array.isArray(show.time)) return;

        show.time.forEach((time) => {
          const dateTimeString = `${show.date}T${time}`;
          showToCreate.push({
            movie: numericMovieId,
            showDateTime: new Date(dateTimeString),
            showPrice,
            occupiedSeats: {}
          });
        });
      });

      if (showToCreate.length > 0) {
        try {
          await Show.insertMany(showToCreate, { ordered: false });
        } catch (err) {
          if (err.code !== 11000) throw err;
        }
      }
    }

    res.json({
      success: true,
      message: "Shows added successfully!"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ----------------------------------
   GET ALL SHOWS
----------------------------------- */
export const getShows = async (req, res) => {
  try {
    const shows = await Show.find({
      showDateTime: { $gte: new Date() }
    })
      .populate("movie")
      .sort({ showDateTime: 1 });

    const uniqueMovieMap = {};
    shows.forEach((show) => {
      if (show.movie && !uniqueMovieMap[show.movie._id]) {
        uniqueMovieMap[show.movie._id] = show.movie;
      }
    });

    res.json({
      success: true,
      shows: Object.values(uniqueMovieMap)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

/* ----------------------------------
   GET SINGLE SHOW
----------------------------------- */
export const getShow = async (req, res) => {
  try {
    const numericMovieId = Number(req.params.movieId);

    if (!Number.isInteger(numericMovieId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Movie ID"
      });
    }

    const shows = await Show.find({
      movie: numericMovieId,
      showDateTime: { $gte: new Date() }
    });

    const movie = await Movie.findById(numericMovieId);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found"
      });
    }

    const dateTime = {};
    shows.forEach((show) => {
      const date = show.showDateTime.toISOString().split("T")[0];
      if (!dateTime[date]) dateTime[date] = [];

      dateTime[date].push({
        time: show.showDateTime.toISOString().slice(11, 16),
        showId: show._id
      });
    });

    res.json({
      success: true,
      movie,
      dateTime
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
