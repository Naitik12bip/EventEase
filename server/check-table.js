import 'dotenv/config';
import { supabase } from './configs/db.js';

async function checkTableStructure() {
  try {
    // Try to insert with minimal data to see what columns are required
    const { error } = await supabase
      .from('bookings')
      .insert([{}]);

    console.log('Insert error (shows required columns):', error);

    // Try to select
    const { data, error: selectError } = await supabase
      .from('bookings')
      .select('*')
      .limit(1);

    if (selectError) {
      console.log('Select error:', selectError);
    } else {
      console.log('Existing data:', data);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkTableStructure();