import 'dotenv/config';
import { supabase } from './configs/db.js';

async function checkShows() {
  try {
    const { data, error } = await supabase
      .from('shows')
      .select('id, theater_name, show_date_time')
      .limit(3);

    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Shows in database:', data);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkShows();