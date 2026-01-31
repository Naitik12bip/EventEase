import express from 'express';
import saveShow, {
  addShow,
  getNowPlayingMovies,
  getShows,
  getShow
} from '../controllers/showController.js';
import { protectAdmin } from '../middleware/auth.js';

const showRouter = express.Router();

// Admin routes
showRouter.post('/add', protectAdmin, addShow);
showRouter.get('/now-playing', protectAdmin, getNowPlayingMovies);

// Public routes
showRouter.get('/all', getShows);
showRouter.get('/:movieId', getShow);

// Save show
showRouter.post('/', async (req, res) => {
  try {
    const savedShow = await saveShow(req.body);
    res.status(201).json({
      success: true,
      message: 'Show saved successfully',
      data: savedShow,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to save show',
      error: err.message,
    });
  }
});

export default showRouter;
