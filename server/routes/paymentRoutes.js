import express from "express";
import { createRazorpayOrder, verifyRazorpayPayment } from "../controllers/paymentController.js";
import crypto from "crypto";
import { supabase } from "../configs/db.js";

const paymentRouter = express.Router();

paymentRouter.post("/create-razorpay-order", createRazorpayOrder);
paymentRouter.post("/verify-razorpay-payment", verifyRazorpayPayment);
paymentRouter.post("/webhook", async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(req.body)
    .digest("hex");

  if (signature !== expectedSignature) {
    return res.status(400).json({ error: "Invalid signature" });
  }

  const event = JSON.parse(req.body);
  console.log("Webhook event:", event.event);

  if (event.event === "payment.captured") {
    const paymentEntity = event.payload.payment.entity;
    const orderId = paymentEntity.order_id;
    // Update booking
    await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('payment_link', orderId);
  }

  res.json({ status: "ok" });
});

export default paymentRouter;
