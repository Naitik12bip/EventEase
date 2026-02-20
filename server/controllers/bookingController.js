/**
 * Booking Controller for Supabase
 * Replaces MongoDB/Mongoose implementation with Supabase PostgreSQL
 */

import { supabase } from '../configs/db.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Create Razorpay Order
 * POST /api/booking/create-razorpay-order
 */
export const createRazorpayOrder = async (req, res) => {
  try {
    const { userId, showId, selectedSeats, totalAmount, convenienceFee } = req.body;

    // Validate show exists
    const { data: show, error: showError } = await supabase
      .from('shows')
      .select('*')
      .eq('id', showId)
      .single();

    if (showError || !show) {
      return res.status(404).json({
        success: false,
        message: 'Show not found'
      });
    }

    // Check seat availability
    const occupiedSeats = show.occupied_seats || {};
    const unavailableSeats = selectedSeats.filter(seat => occupiedSeats[seat.id]);

    if (unavailableSeats.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some seats are already booked',
        unavailableSeats
      });
    }

    // Create Razorpay order
    const orderOptions = {
      amount: Math.round((totalAmount + convenienceFee) * 100), // Amount in paise
      currency: 'INR',
      receipt: `booking_${userId}_${Date.now()}`,
      notes: {
        userId,
        showId,
        seatCount: selectedSeats.length
      }
    };

    const razorpayOrder = await razorpay.orders.create(orderOptions);

    // Create booking record (with pending status)
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([
        {
          user_id: userId,
          show_id: showId,
          total_amount: totalAmount,
          convenience_fee: convenienceFee,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Store payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert([
        {
          booking_id: booking.id,
          user_id: userId,
          amount: totalAmount + convenienceFee,
          status: 'pending',
          razorpay_order_id: razorpayOrder.id
        }
      ]);

    if (paymentError) throw paymentError;

    res.status(200).json({
      success: true,
      data: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        bookingId: booking.id
      }
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Verify Razorpay Payment
 * POST /api/booking/verify-payment
 */
export const verifyPayment = async (req, res) => {
  try {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature, selectedSeats, showId } = req.body;

    // Verify signature
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const digest = shasum.digest('hex');

    if (digest !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Payment signature verification failed'
      });
    }

    // Update booking status
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', bookingId)
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Update payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature
      })
      .eq('booking_id', bookingId);

    if (paymentError) throw paymentError;

    // Get show and update occupied seats
    const { data: show, error: showError } = await supabase
      .from('shows')
      .select('occupied_seats')
      .eq('id', showId)
      .single();

    if (showError) throw showError;

    // Mark seats as occupied
    const occupiedSeats = show.occupied_seats || {};
    const updatedOccupied = {
      ...occupiedSeats,
      ...Object.fromEntries(selectedSeats.map(seat => [seat.id, true]))
    };

    const { error: updateError } = await supabase
      .from('shows')
      .update({ occupied_seats: updatedOccupied })
      .eq('id', showId);

    if (updateError) throw updateError;

    // Create tickets
    const tickets = selectedSeats.map(seat => ({
      booking_id: bookingId,
      seat_id: seat.id,
      show_id: showId,
      user_id: booking.user_id,
      price: seat.price,
      qr_code: `TICKET_${bookingId}_${seat.id}_${Date.now()}`
    }));

    const { data: createdTickets, error: ticketError } = await supabase
      .from('tickets')
      .insert(tickets)
      .select();

    if (ticketError) throw ticketError;

    res.status(200).json({
      success: true,
      data: {
        booking,
        tickets: createdTickets
      },
      message: 'Payment verified and booking confirmed'
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get User Bookings
 * GET /api/booking/user/:userId
 */
export const getUserBookings = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, limit = 10, offset = 0 } = req.query;

    let query = supabase
      .from('bookings')
      .select(`
        *,
        shows (
          id,
          show_date_time,
          show_price,
          movies (id, title, poster_path)
        )
      `)
      .eq('user_id', userId);

    if (status) query = query.eq('status', status);

    const { data: bookings, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Get ticket count
    const { count } = await supabase
      .from('booking')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    res.status(200).json({
      success: true,
      data: bookings,
      total: count || 0
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get Booking Details
 * GET /api/booking/:bookingId
 */
export const getBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        shows (
          id,
          show_date_time,
          show_price,
          movies (id, title, poster_path, overview)
        ),
        tickets (
          id,
          seat_id,
          price,
          qr_code
        ),
        payments (
          id,
          amount,
          status,
          razorpay_payment_id
        )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Cancel Booking
 * POST /api/booking/:bookingId/cancel
 */
export const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Get booking details
    const { data: booking, error: getError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (getError || !booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking already cancelled'
      });
    }

    // Update booking status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (updateError) throw updateError;

    // Get tickets to free up seats
    const { data: tickets, error: ticketError } = await supabase
      .from('tickets')
      .select('seat_id')
      .eq('booking_id', bookingId);

    if (ticketError) throw ticketError;

    // Free up occupied seats
    if (tickets && tickets.length > 0) {
      const { data: show } = await supabase
        .from('shows')
        .select('occupied_seats')
        .eq('id', booking.show_id)
        .single();

      const occupiedSeats = { ...show.occupied_seats };
      tickets.forEach(ticket => {
        delete occupiedSeats[ticket.seat_id];
      });

      await supabase
        .from('shows')
        .update({ occupied_seats: occupiedSeats })
        .eq('id', booking.show_id);
    }

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get All Bookings (Admin)
 * GET /api/booking/admin/all
 */
export const getAllBookings = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('bookings')
      .select(`
        *,
        shows (
          id,
          movies (id, title)
        ),
        payments (id, status, amount)
      `);

    if (status) query = query.eq('status', status);

    const { data: bookings, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Get total count
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });

    res.status(200).json({
      success: true,
      data: bookings,
      total: count || 0
    });
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Backward-compatible handlers used by existing route files
export const createBooking = createRazorpayOrder;

export const getOccupiedSeats = async (req, res) => {
  try {
    const { showId } = req.params;

    const { data: show, error } = await supabase
      .from('shows')
      .select('occupied_seats')
      .eq('id', showId)
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      occupiedSeats: show?.occupied_seats || {}
    });
  } catch (error) {
    console.error('Error fetching occupied seats:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export default {
  createBooking,
  getOccupiedSeats,
  createRazorpayOrder,
  verifyPayment,
  getUserBookings,
  getBookingDetails,
  cancelBooking,
  getAllBookings
};
