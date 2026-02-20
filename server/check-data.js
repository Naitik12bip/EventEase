import 'dotenv/config';
import { supabase } from './configs/db.js';

async function checkData() {
  try {
    // Check movies table
    const { data: movies, error: moviesError } = await supabase
      .from('movies')
      .select('*')
      .limit(5);

    console.log('Movies:', movies?.length || 0, 'records');
    if (moviesError) console.error('Movies error:', moviesError);

    // Check shows table
    const { data: shows, error: showsError } = await supabase
      .from('shows')
      .select('*')
      .limit(5);

    console.log('Shows:', shows?.length || 0, 'records');
    if (showsError) console.error('Shows error:', showsError);

    // Check bookings table
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .limit(5);

    console.log('Bookings:', bookings?.length || 0, 'records');
    if (bookingsError) console.error('Bookings error:', bookingsError);

    // Check profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    console.log('Profiles:', profiles?.length || 0, 'records');
    if (profilesError) console.error('Profiles error:', profilesError);

  } catch (error) {
    console.error('Error:', error);
  }
}

checkData();