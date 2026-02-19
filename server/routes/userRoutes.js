import express from "express";
import { getFavorites, getUserBookings, updateFavorite, getUserBookingsFunction } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.get('/bookings', getUserBookings)
userRouter.post('/get-user-bookings', getUserBookingsFunction)
userRouter.post('/update-favorite', updateFavorite)
userRouter.get('/favorites', getFavorites)

export default userRouter;