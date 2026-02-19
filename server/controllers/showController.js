/**
 * Show Controller for Supabase
 * Replaces MongoDB/Mongoose implementation with Supabase PostgreSQL
 */

import { supabase } from '../configs/db.js';
import axios from 'axios';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

/**
 * Get Now Playing Movies with Shows
 * GET /api/show/now-playing
 */
export const getNowPlayingShows = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // Get movies from Supabase
    const { data: movies, error } = await supabase
      .from('movies')
      .select('*')
      .order('vote_average', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    // Get shows for each movie
    const showsData = await Promise.all(
      movies.map(async (movie) => {
        const { data: shows } = await supabase
          .from('shows')
          .select('*')
          .eq('movie_id', movie.id)
          .order('show_date_time', { ascending: true });

        return {
          ...movie,
          shows: shows || []
        };
      })
    );

    res.status(200).json({
      success: true,
      data: showsData,
      total: movies.length
    });
  } catch (error) {
    console.error('Error fetching now playing shows:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get Movie Details by ID with Shows
 * GET /api/show/:movieId
 */
export const getMovieDetails = async (req, res) => {
  try {
    const { movieId } = req.params;

    // Get movie from Supabase
    const { data: movie, error: movieError } = await supabase
      .from('movies')
      .select('*')
      .eq('id', movieId)
      .single();

    if (movieError || !movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    // Get shows for this movie
    const { data: shows, error: showsError } = await supabase
      .from('shows')
      .select('*')
      .eq('movie_id', movieId)
      .order('show_date_time', { ascending: true });

    if (showsError) throw showsError;

    res.status(200).json({
      success: true,
      data: {
        ...movie,
        shows: shows || []
      }
    });
  } catch (error) {
    console.error('Error fetching movie details:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Create Show
 * POST /api/show/create
 * Admin only
 */
export const createShow = async (req, res) => {
  try {
    const { movieId, showDateTime, price, occupiedSeats } = req.body;

    // Validate movie exists
    const { data: movie } = await supabase
      .from('movies')
      .select('id')
      .eq('id', movieId)
      .single();

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }

    // Create show
    const { data: show, error } = await supabase
      .from('shows')
      .insert([
        {
          movie_id: movieId,
          show_date_time: showDateTime,
          show_price: price,
          occupied_seats: occupiedSeats || {}
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: show,
      message: 'Show created successfully'
    });
  } catch (error) {
    console.error('Error creating show:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Update Show Occupied Seats
 * POST /api/show/:showId/occupy-seats
 */
export const occupySeats = async (req, res) => {
  try {
    const { showId } = req.params;
    const { seatIds } = req.body;

    // Get current occupied seats
    const { data: show, error: getError } = await supabase
      .from('shows')
      .select('occupied_seats')
      .eq('id', showId)
      .single();

    if (getError) throw getError;

    // Add new occupied seats
    const currentOccupied = show.occupied_seats || {};
    const updatedOccupied = {
      ...currentOccupied,
      ...Object.fromEntries(seatIds.map(id => [id, true]))
    };

    // Update show
    const { data: updatedShow, error: updateError } = await supabase
      .from('shows')
      .update({ occupied_seats: updatedOccupied })
      .eq('id', showId)
      .select()
      .single();

    if (updateError) throw updateError;

    res.status(200).json({
      success: true,
      data: updatedShow,
      message: 'Seats occupied successfully'
    });
  } catch (error) {
    console.error('Error occupying seats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get Occupied Seats for a Show
 * GET /api/show/:showId/occupied-seats
 */
export const getOccupiedSeats = async (req, res) => {
  try {
    const { showId } = req.params;

    const { data: show, error } = await supabase
      .from('shows')
      .select('occupied_seats')
      .eq('id', showId)
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: show.occupied_seats || {}
    });
  } catch (error) {
    console.error('Error fetching occupied seats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Search Shows by Filters
 * GET /api/show/search?city=&date=&genre=
 */
export const searchShows = async (req, res) => {
  try {
    const { city, date, genre, minPrice, maxPrice } = req.query;

    let query = supabase
      .from('shows')
      .select(`
        *,
        movies (
          id, title, poster_path, genres
        )
      `);

    // Add filters
    if (date) {
      const startDate = new Date(date).toISOString();
      const endDate = new Date(new Date(date).getTime() + 86400000).toISOString();
      query = query.gte('show_date_time', startDate).lt('show_date_time', endDate);
    }

    if (minPrice) query = query.gte('show_price', parseFloat(minPrice));
    if (maxPrice) query = query.lte('show_price', parseFloat(maxPrice));

    const { data: shows, error } = await query.order('show_date_time', { ascending: true });

    if (error) throw error;

    // Client-side filtering for complex queries
    let results = shows;
    if (genre) {
      results = results.filter(show =>
        show.movies?.genres?.some(g => g.name.toLowerCase().includes(genre.toLowerCase()))
      );
    }

    res.status(200).json({
      success: true,
      data: results,
      total: results.length
    });
  } catch (error) {
    console.error('Error searching shows:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Sync Movies from TMDB
 * POST /api/show/sync-tmdb
 * Admin only
 */
export const syncMoviesFromTMDB = async (req, res) => {
  try {
    const { page = 1 } = req.body;

    // Fetch from TMDB
    const response = await axios.get(
      `${BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&region=IN&page=${page}`
    );

    const tmdbMovies = response.data.results.map(movie => ({
      id: movie.id.toString(),
      title: movie.title,
      overview: movie.overview,
      poster_path: movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : null,
      backdrop_path: movie.backdrop_path
        ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
        : null,
      release_date: movie.release_date,
      original_language: movie.original_language,
      vote_average: movie.vote_average,
      popularity: movie.popularity
    }));

    // Upsert into Supabase
    const { data: movies, error } = await supabase
      .from('movies')
      .upsert(tmdbMovies, { onConflict: 'id' })
      .select();

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: movies,
      message: `Synced ${movies.length} movies from TMDB`,
      totalPages: response.data.total_pages
    });
  } catch (error) {
    console.error('Error syncing TMDB movies:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Delete Show
 * DELETE /api/show/:showId
 * Admin only
 */
export const deleteShow = async (req, res) => {
  try {
    const { showId } = req.params;

    const { error } = await supabase
      .from('shows')
      .delete()
      .eq('id', showId);

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: 'Show deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting show:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export default {
  getNowPlayingShows,
  getMovieDetails,
  createShow,
  occupySeats,
  getOccupiedSeats,
  searchShows,
  syncMoviesFromTMDB,
  deleteShow
};
