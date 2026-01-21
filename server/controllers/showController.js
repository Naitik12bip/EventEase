import axios from "axios";
import Movie from "../models/Movie";

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

        let movie = await Movie.findById(movieId);
        if (!movie) {
            // fetch movie details and credits from TMDB API
        }
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message })
    }
}