import express from 'express';
import { addShow, getNowPlayingMovies, getShows ,getShow } from '../controllers/showController.js';
import saveShow from '../controllers/showController.js';  // Correctly import saveShow from the controller
import { protectAdmin } from '../middleware/auth.js';

const showRouter = express.Router();

// GET route to fetch now playing movies
showRouter.get('/now-playing', protectAdmin, getNowPlayingMovies);
// POST route to add a new show
showRouter.post('/add',protectAdmin, addShow);
showRouter.get('/all', getShows);
showRouter.get('/:movieId', getShow);
// POST route to save a show (you can keep this or remove it if addShow is handling this)
showRouter.post('/', async (req, res) => {
    try {
        const showData = req.body;  // Assuming the client sends show data in the body

        // Call saveShow with the received data
        const savedShow = await saveShow(showData);

        // Respond with the saved show data
        res.status(201).json({
            success: true,
            message: 'Show saved successfully',
            data: savedShow,
        });
    } catch (err) {
        // Handle any errors (e.g., validation errors, database issues)
        res.status(500).json({
            success: false,
            message: 'Failed to save show',
            error: err.message,
        });
    }
});

export default showRouter;
