import 'dotenv/config';
import { supabase } from './configs/db.js';

async function populateShows() {
  try {
    console.log('Creating sample shows...');

    // Get some movies first
    const { data: movies, error } = await supabase
      .from('movies')
      .select('id, title')
      .limit(5);

    if (error || !movies || movies.length === 0) {
      console.error('No movies found. Please run populate-movies.js first.');
      return;
    }

    const theaters = [
      { name: 'PVR Cinemas', location: 'Downtown' },
      { name: 'INOX', location: 'Mall Road' },
      { name: 'Cinepolis', location: 'City Center' }
    ];

    const shows = [];

    // Create shows for each movie
    for (const movie of movies) {
      for (const theater of theaters) {
        // Create 2-3 shows per movie per theater
        const numShows = Math.floor(Math.random() * 2) + 2;

        for (let i = 0; i < numShows; i++) {
          const showDate = new Date();
          showDate.setDate(showDate.getDate() + Math.floor(Math.random() * 7)); // Next 7 days
          showDate.setHours(10 + i * 3, 0, 0, 0); // 10 AM, 1 PM, 4 PM, etc.

          shows.push({
            movie_id: movie.id,
            theater_name: theater.name,
            location: theater.location,
            show_date_time: showDate.toISOString(),
            price: Math.floor(Math.random() * 200) + 100, // 100-300
            total_seats: 100
          });
        }
      }
    }

    console.log(`Inserting ${shows.length} shows...`);

    const { error: insertError } = await supabase
      .from('shows')
      .insert(shows);

    if (insertError) {
      console.error('Error inserting shows:', insertError);
    } else {
      console.log('Shows inserted successfully!');
    }

  } catch (error) {
    console.error('Error populating shows:', error);
  }
}

populateShows();