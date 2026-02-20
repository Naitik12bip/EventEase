import 'dotenv/config';
import { supabase } from './configs/db.js';

async function testInsert() {
  try {
    console.log('Testing database insert...');

    // Try to insert a simple test movie with UUID
    const testMovie = {
      id: '550e8400-e29b-41d4-a716-446655440000', // UUID format
      title: 'Test Movie',
      overview: 'This is a test movie',
      release_date: '2024-01-01',
      vote_average: 8.5,
      vote_count: 100
    };

    const { data, error } = await supabase
      .from('movies')
      .insert(testMovie)
      .select();

    if (error) {
      console.error('Insert error:', error);
      console.log('This suggests the table schema needs to be updated to use TEXT for id instead of UUID');
    } else {
      console.log('Insert successful:', data);
    }

    // Check current movies
    const { data: movies, error: fetchError } = await supabase
      .from('movies')
      .select('*');

    console.log('Total movies in database:', movies?.length || 0);

  } catch (error) {
    console.error('Test error:', error);
  }
}

testInsert();