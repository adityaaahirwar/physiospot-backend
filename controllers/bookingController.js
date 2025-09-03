import dotenv from "dotenv";
dotenv.config();

import Booking from "../models/BookingSchema.js";
import Doctor from "../models/DoctorSchema.js";
import User from "../models/UserSchema.js";
import Razorpay from "razorpay";
import crypto from "crypto";

// ✅ Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// -------------------------
// Create Order
// -------------------------
export const getCheckoutSession = async (req, res) => {
  try {
    console.log("➡️ Incoming request to create Razorpay order");
    console.log("Doctor ID from req.params:", req.params.doctorId);
    console.log("User ID from token (req.userId):", req.userId);

    const doctor = await Doctor.findById(req.params.doctorId);
    const user = await User.findById(req.userId);

    console.log("Doctor found:", doctor ? doctor._id : "❌ Not Found");
    console.log("User found:", user ? user._id : "❌ Not Found");

    if (!doctor || !user) {
      console.log("❌ Either doctor or user not found, aborting order creation");
      return res
        .status(404)
        .json({ success: false, message: "Doctor or user not found" });
    }

    const options = {
      amount: doctor.ticketPrice * 100, // amount in paisa
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        doctorId: doctor._id.toString(),
        userId: user._id.toString(),
      },
    };

    console.log("📦 Razorpay order options:", options);

    const order = await razorpay.orders.create(options);
    console.log("✅ Razorpay order created:", order.id);

    const booking = new Booking({
      doctor: doctor._id,
      user: user._id,
      ticketPrice: doctor.ticketPrice,
      session: order.id,
      status: "pending",
    });

    await booking.save();
    console.log("📝 Booking saved with status pending, ID:", booking._id);

    res.status(200).json({
      success: true,
      message: "Order created successfully",
      order,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("🔥 Error in getCheckoutSession:", error);
    res
      .status(500)
      .json({ success: false, message: "Error creating Razorpay order" });
  }
};


// -------------------------
// Verify Payment Signature
// -------------------------
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      await Booking.findOneAndUpdate(
        { session: razorpay_order_id },
        { status: "paid", paymentId: razorpay_payment_id }
      );

      return res.json({
        success: true,
        message: "Payment verified successfully",
      });
    } else {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error verifying payment" });
  }
};
