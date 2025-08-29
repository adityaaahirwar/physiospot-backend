import express from "express";
import { authenticate, restrict } from "./../auth/verifyToken.js";
import { getCheckoutSession, verifyPayment } from "../controllers/bookingController.js";

const router = express.Router();

// ✅ Create Razorpay order
router.post(
  "/checkout-session/:doctorId",
  authenticate,
  restrict(["patient"]),
  getCheckoutSession
);

// ✅ Verify Razorpay payment
router.post(
  "/verify-payment",
  authenticate,
  restrict(["patient"]),
  verifyPayment
);

export default router;
