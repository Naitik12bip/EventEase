import express from 'express';
import { addShow, getNowPlayingMovies } from '../controllers/showController.js';

const showRouter = express.Router();

showRouter.get('/now-playing', getNowPlayingMovies);
showRouter.post('/add', addShow);
showRouter.post('/', async (req, res) => {
    try {
        // Call saveShow with data from the request body
        const showData = req.body;  // Assuming the client sends show data in the body

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