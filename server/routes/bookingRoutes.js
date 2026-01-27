import express from "express";
import { createBooking, getOccupiedSeats } from "../controllers/bookingController";

const bookingRouter = express.Router();

bookingRouter.post("/create", createBooking);
bookingRouter.post("/seats/:showId", getOccupiedSeats);

export default bookingRouter;