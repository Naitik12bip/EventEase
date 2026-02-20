import { Inngest } from "inngest";
//import User from "../models/User.js";
//import Booking from "../models/Booking.js";
//import Show from "../models/Show.js";
import sendEmail from "../configs/nodeMailer.js";
//import { set } from "mongoose";

export const inngest = new Inngest({ id: "movie-ticket-booking" });

// Inngest Function to save user data to a database
const syncUserCreation = inngest.createFunction(
    { id: 'sync-user-from-clerk' },
  { event: 'clerk/user.created' },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data;
    await supabase.from('profiles').upsert({
      id,
      user_id: id,
      email: email_addresses?.[0]?.email_address,
      name: `${first_name || ''} ${last_name || ''}`.trim(),
      image: image_url,
      updated_at: new Date().toISOString()
    });
  }
);

// Inngest Function to delete user from database
const syncUserDeletion = inngest.createFunction(
    { id: 'delete-user-with-clerk' },
  { event: 'clerk/user.deleted' },
  async ({ event }) => {
    await supabase.from('profiles').delete().eq('id', event.data.id);
  }
);

// Inngest Function to update user data in database 
const syncUserUpdation = inngest.createFunction(
    { id: 'update-user-from-clerk' },
  { event: 'clerk/user.updated' },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data;
    await supabase.from('profiles').update({
      email: email_addresses?.[0]?.email_address,
      name: `${first_name || ''} ${last_name || ''}`.trim(),
      image: image_url,
      updated_at: new Date().toISOString()
    }).eq('id', id);
  }
);

// Inngest Function to cancel booking and release seats of show after 10 minutes of booking created if payment is not made
const releaseSeatsAndDeleteBooking = inngest.createFunction(
    { id: 'release-seats-delete-booking' },
  { event: 'app/checkpayment' },
  async ({ event, step }) => {
    await step.sleepUntil('wait-for-10-minutes', new Date(Date.now() + 10 * 60 * 1000));

    await step.run('check-payment-status', async () => {
      const bookingId = event.data.bookingId;
      const { data: booking } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
      if (!booking || booking.status === 'confirmed') return;

      const { data: show } = await supabase.from('shows').select('occupied_seats').eq('id', booking.show_id).single();
      const occupiedSeats = { ...(show?.occupied_seats || {}) };
      (booking.booked_seats || []).forEach((seat) => delete occupiedSeats[seat]);
      await supabase.from('shows').update({ occupied_seats: occupiedSeats }).eq('id', booking.show_id);
      await supabase.from('bookings').delete().eq('id', bookingId);
    });
  }
);

// Inngest Function to send email when user books a show
const sendBookingConfirmationEmail = inngest.createFunction(
{ id: 'send-booking-confirmation-email' },
  { event: 'app/show.booked' },
  async ({ event }) => {
    const { bookingId } = event.data;
    const { data: booking } = await supabase
      .from('bookings')
      .select('*, shows(*, movies(*)), profiles(*)')
      .eq('id', bookingId)
      .single();

    if (!booking?.profiles?.email) return;

    await sendEmail({
      to: booking.profiles.email,
      subject: `Payment Confirmation: "${booking.shows?.movies?.title || 'Show'}" booked!`,
      body: `<p>Hi ${booking.profiles.name || 'User'}, your booking is confirmed.</p>`
    });
  }
);

export const functions = [
    syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  releaseSeatsAndDeleteBooking,
  sendBookingConfirmationEmail
];