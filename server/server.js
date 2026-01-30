import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"

// Route Imports
import showRouter from './routes/showRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import userRouter from './routes/userRoutes.js';

// Handler Import
import inngestHandler from './inngest/handler.js';

const app = express();
const port = process.env.PORT || 3000;

// Connect to Database
await connectDB();

// --- Middleware Stack ---
app.use(cors());
app.use(express.json()); // Body parser must come before routes
app.use(clerkMiddleware());

// JSON Syntax Error Handler (Fixed: placed specifically after express.json)
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error("Bad JSON received:", err.message);
    return res.status(400).json({ success: false, message: "Invalid JSON format. Check for hidden characters!" });
  }
  next();
});

// --- API Routes ---

// 1. Health Check
app.get('/', (req, res) => res.send('Server Is Live!'));

// 2. User Routes (Full path: /api/user/favorites)
app.use('/api/user', userRouter);

// 3. Shows Routes (Full path: /api/shows/all)
app.use('/api/shows', showRouter);

// 4. Inngest
app.use('/api/inngest', serve({ inngestHandler, client: inngest, functions }));

// 5. Bookings & Admin
app.use('/api/booking', bookingRouter);
app.use('/api/admin', adminRouter);

// Start Server
app.listen(port, () => console.log(`Server listening at http://localhost:${port}`));