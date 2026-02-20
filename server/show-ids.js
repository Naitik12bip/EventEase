import 'dotenv/config';
import { supabase } from './configs/db.js';

(async () => {
  const { data, error } = await supabase.from('shows').select('id, movie_title, show_date, show_time, theater_name').limit(10);
  if (error) {
    console.error('Error fetching shows:', error);
  } else {
    console.log('Available shows in database:');
    console.log('=====================================');
    data.forEach((show, index) => {
      console.log(`${index + 1}. ID: ${show.id}`);
      console.log(`   Movie: ${show.movie_title}`);
      console.log(`   Date: ${show.show_date}`);
      console.log(`   Time: ${show.show_time}`);
      console.log(`   Theater: ${show.theater_name}`);
      console.log('');
    });
    console.log('=====================================');
    console.log('Use these UUIDs instead of formatted strings like "show_2026-02-22_4"');
  }
})();