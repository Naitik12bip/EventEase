import axios from 'axios';
import 'dotenv/config';

async function testTMDB() {
  try {
    console.log('Testing TMDB API with key:', process.env.TMDB_API_KEY);
    const response = await axios.get(`https://api.themoviedb.org/3/movie/now_playing?api_key=${process.env.TMDB_API_KEY}&language=en-US&page=1`);
    console.log('TMDB API is working! Found', response.data.results.length, 'movies');
    console.log('First movie:', response.data.results[0].title);
  } catch (error) {
    console.error('TMDB API error:', error.response?.status, error.response?.data || error.message);
  }
}

testTMDB();