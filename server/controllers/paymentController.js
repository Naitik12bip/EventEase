import Razorpay from "razorpay";
import crypto from "crypto";
//import Booking from "../models/Booking.js";
//import Show from "../models/Show.js";
import { supabase } from "../configs/db.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createRazorpayOrder = async (req, res) => {
  try {
    const { eventId, showId, seatIds, ticketPrice } = req.body;
    const userId = req.auth().userId;

    // Calculate total amount
    const amount = ticketPrice * seatIds.length;

     const { data: show } = await supabase
      .from('shows')
      .select('occupied_seats')
      .eq('id', showId)
      .single();

    if (!show) {
      return res.status(404).json({ success: false, error: "Show not found" });
    }

    const occupiedSeats = show.occupied_seats || {};
    const isAnySeatTaken = seatIds.some((seat) => occupiedSeats[seat]);

    if (isAnySeatTaken) {
      return res.status(400).json({ success: false, error: "Some seats are already occupied" });
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        eventId,
        showId,
        userId,
        seats: seatIds.join(","),
      },
    });

    await supabase.from('bookings').insert({
      user_id: userId,
      show_id: showId,
      total_amount: amount,
      booked_seats: seatIds,
      status: 'pending',
      payment_link: order.id,
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature, showId, seatIds } = req.body;

    // Verify payment signature
    const sign = orderId + "|" + paymentId;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (signature !== expectedSign) {
      return res.status(400).json({ success: false, error: "Payment verification failed" });
    }

    // Update booking as paid
    const { data: booking } = await supabase
      .from('bookings')
      .update({ status: 'confirmed', razorpay_payment_id: paymentId })
      .eq('payment_link', orderId)
      .select('*')
      .single();

    if (!booking) {
      return res.status(404).json({ success: false, error: "Booking not found" });
    }

    // Update occupied seats in show
    const { data: show } = await supabase
      .from('shows')
      .select('occupied_seats')
      .eq('id', showId)
      .single();

    const occupiedSeats = show?.occupied_seats || {};
    seatIds.forEach((seat) => {
      occupiedSeats[seat] = true;
    });

    await supabase
      .from('shows')
      .update({ occupied_seats: occupiedSeats })
      .eq('id', showId);


    res.json({ success: true, message: "Payment verified and booking confirmed" });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
