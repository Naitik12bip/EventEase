import axios from 'axios';
import 'dotenv/config';
import { supabase } from './configs/db.js';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

async function populateMovies() {
  try {
    console.log('Fetching movies from TMDB...');

    // Get now playing movies
    const response = await axios.get(`${BASE_URL}/movie/now_playing`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        page: 1
      }
    });

    const movies = response.data.results.slice(0, 20); // Get first 20 movies

    console.log(`Found ${movies.length} movies. Inserting into Supabase...`);

    // Insert movies into Supabase
    for (const movie of movies) {
      const movieData = {
        id: movie.id.toString(), // TMDB ID as string
        title: movie.title,
        overview: movie.overview,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        vote_count: movie.vote_count,
        genre_ids: movie.genre_ids,
        adult: movie.adult,
        original_language: movie.original_language,
        original_title: movie.original_title,
        popularity: movie.popularity,
        video: movie.video
      };

      const { error } = await supabase
        .from('movies')
        .upsert(movieData, { onConflict: 'id' });

      if (error) {
        console.error('Error inserting movie:', movie.title, error);
      } else {
        console.log('Inserted movie:', movie.title);
      }
    }

    console.log('Movie population complete!');

  } catch (error) {
    console.error('Error populating movies:', error);
  }
}

populateMovies();