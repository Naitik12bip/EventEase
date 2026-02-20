import 'dotenv/config';
import { supabase } from './configs/db.js';

async function testBookingFlow() {
  try {
    console.log('=== TESTING BOOKING FLOW ===\n');

    // First, let's check if we have users, shows, and movies
    const { data: users } = await supabase.from('profiles').select('id, name').limit(1);
    const { data: shows } = await supabase.from('shows').select('id, movie_id, theater_name').limit(1);
    const { data: movies } = await supabase.from('movies').select('id, title').limit(1);

    console.log('Available data:');
    console.log(`- Users: ${users?.length || 0}`);
    console.log(`- Shows: ${shows?.length || 0}`);
    console.log(`- Movies: ${movies?.length || 0}`);

    // Create a test user if none exists
    let testUserId;
    if (!users || users.length === 0) {
      console.log('\n--- Creating Test User ---');
      const { data: newUser, error: userError } = await supabase
        .from('profiles')
        .insert([
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Test User',
            email: 'test@example.com'
          }
        ])
        .select()
        .single();

      if (userError) {
        console.error('❌ User creation failed:', userError);
        return;
      }

      testUserId = newUser.id;
      console.log('✅ Test user created:', testUserId);
    } else {
      testUserId = users[0].id;
      console.log('Using existing user:', testUserId);
    }

    if (!shows || shows.length === 0) {
      console.log('\n❌ No shows found. Create shows first.');
      return;
    }

    // Test creating a booking
    const testShowId = shows[0].id;
    const testSeats = [
      { id: 'A1', price: 200 },
      { id: 'A2', price: 200 }
    ];

    console.log('\n--- Creating Test Booking ---');
    console.log(`User ID: ${testUserId}`);
    console.log(`Show ID: ${testShowId}`);
    console.log(`Seats: ${testSeats.map(s => s.id).join(', ')}`);

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([
        {
          user_id: testUserId,
          event_id: 'test-event-123',
          show_id: testShowId,
          selected_seats: testSeats,
          total_amount: 400,
          convenience_fee: 20,
          status: 'confirmed'
        }
      ])
      .select()
      .single();

    if (bookingError) {
      console.error('❌ Booking creation failed:', bookingError);
      return;
    }

    console.log('✅ Booking created successfully:', booking.id);

    // Test retrieving user bookings
    console.log('\n--- Testing Booking Retrieval ---');

    const { data: userBookings, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', testUserId);

    if (fetchError) {
      console.error('❌ Booking retrieval failed:', fetchError);
      return;
    }

    console.log(`✅ Found ${userBookings?.length || 0} bookings for user`);
    if (userBookings && userBookings.length > 0) {
      console.log('Sample booking:', {
        id: userBookings[0].id,
        status: userBookings[0].status,
        total_amount: userBookings[0].total_amount,
        selected_seats: userBookings[0].selected_seats
      });
    }

    console.log('\n🎉 BOOKING SYSTEM TEST COMPLETED SUCCESSFULLY!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBookingFlow();