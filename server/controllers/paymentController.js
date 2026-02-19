import Razorpay from "razorpay";
import crypto from "crypto";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";

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

    // Check seat availability
    const show = await Show.findById(showId);
    if (!show) {
      return res.status(404).json({ success: false, error: "Show not found" });
    }

    const occupiedSeats = show.occupiedSeats || [];
    const isAnySeatTaken = seatIds.some(seat => occupiedSeats.includes(seat));

    if (isAnySeatTaken) {
      return res.status(400).json({ success: false, error: "Some seats are already occupied" });
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        eventId,
        showId,
        userId,
        seats: seatIds.join(","),
      },
    });

    // Create pending booking
    const booking = new Booking({
      user: userId,
      show: showId,
      amount: amount,
      bookedSeats: seatIds,
      isPaid: false,
      paymentLink: order.id,
    });
    await booking.save();

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
    const { orderId, paymentId, signature, userId, showId, seatIds } = req.body;

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
    const booking = await Booking.findOneAndUpdate(
      { paymentLink: orderId, user: userId },
      { isPaid: true },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ success: false, error: "Booking not found" });
    }

    // Update occupied seats in show
    await Show.findByIdAndUpdate(showId, {
      $push: { occupiedSeats: { $each: seatIds } }
    });

    res.json({ success: true, message: "Payment verified and booking confirmed" });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
