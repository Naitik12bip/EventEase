import express from "express";
import { 
    getFavoriteMovies, 
    getUserBookings, 
    updateFavorite 
} from "../controllers/userController.js";

const userRouter = express.Router();

// Full path: GET /api/user/bookings
userRouter.get('/bookings', getUserBookings);

// Full path: POST /api/user/update-favorites
userRouter.post('/update-favorites', updateFavorite);

// Full path: GET /api/user/favorites
// FIX: Removed the extra test function that was causing execution issues
userRouter.get('/favorites', getFavoriteMovies);

export default userRouter;