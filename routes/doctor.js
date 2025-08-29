import {
  adminAuth,
  authenticate,
  doctorAuth,
  restrict,
} from "../auth/verifyToken.js";
import {
  deleteDoctor,
  getAllDoctor,
  getDoctorProfile,
  getSingleDoctor,
  updateDoctor,
} from "../controllers/doctorController.js";
import express from "express";
// import { createReview } from "../controllers/reviewController.js";
import reviewRouter from "../routes/review.js";

const router = express.Router();

router.use("/:doctorId/reviews", reviewRouter);

// get all doctors
router.get("/", getAllDoctor);
router.get("/:id", getSingleDoctor);
router.put("/:id", authenticate, doctorAuth, updateDoctor);
router.delete("/:id", authenticate, doctorAuth, deleteDoctor);
router.get("/profile/me", authenticate, restrict(["doctor"]), getDoctorProfile);

export default router;
