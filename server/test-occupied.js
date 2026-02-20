import 'dotenv/config';
import { supabase } from './configs/db.js';

async function testOccupiedSeats() {
  try {
    const showId = 'ad154756-ce0e-486d-bfae-22b048096b7a';
    const { data, error } = await supabase
      .from('shows')
      .select('occupied_seats')
      .eq('id', showId)
      .single();

    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Occupied seats for show', showId, ':', data?.occupied_seats || {});
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testOccupiedSeats();