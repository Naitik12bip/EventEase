/**
 * User Controller for Supabase
 * Replaces MongoDB/Mongoose implementation with Supabase PostgreSQL
 */

import { supabase } from "../configs/db.js";

/**
 * Get User Profile
 * GET /api/user/:userId
 */
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: user, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update User Profile
 * PUT /api/user/:userId
 */
export const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, phone, image } = req.body;

    const { data: user, error } = await supabase
      .from("profiles")
      .update({
        name: name || undefined,
        phone: phone || undefined,
        image: image || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: user,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Create User Profile
 * POST /api/user/create
 * Called during user signup/authentication
 */
export const createUserProfile = async (req, res) => {
  try {
    const { userId, name, email, phone, image } = req.body;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Create user profile
    const { data: user, error } = await supabase
      .from("profiles")
      .insert([
        {
          id: userId,
          user_id: userId, // Clerk user_id
          name: name || "Anonymous",
          email,
          phone: phone || null,
          image: image || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: user,
      message: "User profile created successfully",
    });
  } catch (error) {
    console.error("Error creating user profile:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Add Movie to Favorites
 * POST /api/user/:userId/favorites/add
 */
export const addToFavorites = async (req, res) => {
  try {
    const { userId } = req.params;
    const { movieId } = req.body;

    // Check if movie exists
    const { data: movie } = await supabase
      .from("movies")
      .select("id")
      .eq("id", movieId)
      .single();

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    // Check if already favorited
    const { data: existing } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("movie_id", movieId)
      .single();

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Movie already in favorites",
      });
    }

    // Add to favorites
    const { data: favorite, error } = await supabase
      .from("favorites")
      .insert([
        {
          user_id: userId,
          movie_id: movieId,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: favorite,
      message: "Added to favorites",
    });
  } catch (error) {
    console.error("Error adding to favorites:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Remove Movie from Favorites
 * DELETE /api/user/:userId/favorites/:movieId
 */
export const removeFromFavorites = async (req, res) => {
  try {
    const { userId, movieId } = req.params;

    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("movie_id", movieId);

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: "Removed from favorites",
    });
  } catch (error) {
    console.error("Error removing from favorites:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get User Favorites
 * GET /api/user/:userId/favorites
 */
export const getUserFavorites = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    // Get favorite movie IDs
    const { data: favorites, error: favError } = await supabase
      .from("favorites")
      .select("movie_id")
      .eq("user_id", userId)
      .range(offset, offset + limit - 1);

    if (favError) throw favError;

    if (!favorites || favorites.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        total: 0,
      });
    }

    // Get movie details
    const movieIds = favorites.map((f) => f.movie_id);
    const { data: movies, error: movieError } = await supabase
      .from("movies")
      .select("*")
      .in("id", movieIds);

    if (movieError) throw movieError;

    // Get total count
    const { count } = await supabase
      .from("favorites")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    res.status(200).json({
      success: true,
      data: movies,
      total: count || 0,
    });
  } catch (error) {
    console.error("Error fetching user favorites:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Check if Movie is Favorited
 * GET /api/user/:userId/favorites/:movieId/check
 */
export const isFavorited = async (req, res) => {
  try {
    const { userId, movieId } = req.params;

    const { data: favorite, error } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("movie_id", movieId)
      .single();

    res.status(200).json({
      success: true,
      isFavorited: !!favorite && !error,
    });
  } catch (error) {
    // If error is "not found", that's OK - just means not favorited
    if (error?.code === "PGRST116") {
      return res.status(200).json({
        success: true,
        isFavorited: false,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get All Users (Admin Only)
 * GET /api/user/admin/all
 */
export const getAllUsers = async (req, res) => {
  try {
    const { limit = 50, offset = 0, search } = req.query;

    let query = supabase
      .from("profiles")
      .select("id, name, email, phone, image, created_at");

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Get total count
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    res.status(200).json({
      success: true,
      data: users,
      total: count || 0,
    });
  } catch (error) {
    console.error("Error fetching all users:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get User Statistics (Admin)
 * GET /api/user/admin/stats/:userId
 */
export const getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;

    // Total bookings
    const { count: totalBookings } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // Confirmed bookings
    const { count: confirmedBookings } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "confirmed");

    // Cancelled bookings
    const { count: cancelledBookings } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "cancelled");

    // Total spent
    const { data: payments, error: paymentError } = await supabase
      .from("payments")
      .select("amount")
      .eq("user_id", userId)
      .eq("status", "completed");

    const totalSpent = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;

    // Favorites count
    const { count: favoriteCount } = await supabase
      .from("favorites")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    res.status(200).json({
      success: true,
      data: {
        totalBookings: totalBookings || 0,
        confirmedBookings: confirmedBookings || 0,
        cancelledBookings: cancelledBookings || 0,
        totalSpent,
        favoriteCount: favoriteCount || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUserBookings = async (req, res) => {
  try {
    const userId = req.auth()?.userId || req.params.userId;
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        shows (
          id,
          show_date_time,
          show_price,
          movies (id, title, poster_path)
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json({ success: true, bookings: data || [] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Backward-compatible handlers used by existing route files
export const getFavorites = async (req, res) => {
  req.params.userId = req.auth()?.userId;
  return getUserFavorites(req, res);
};

export const getUserBookingsFunction = async (req, res) => {
  req.params.userId = req.body?.userId || req.auth()?.userId;
  return getUserBookings(req, res);
};

export const updateFavorite = async (req, res) => {
  try {
    req.params.userId = req.auth()?.userId;
    req.body.movieId = req.body.movieId || req.body.movie;

    const { data: existing } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", req.params.userId)
      .eq("movie_id", req.body.movieId)
      .maybeSingle();

    if (existing) {
      return removeFromFavorites(req, res);
    }

    return addToFavorites(req, res);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getFavorites,
  getUserBookings,
  updateFavorite,
  getUserBookingsFunction,
  getUserProfile,
  updateUserProfile,
  createUserProfile,
  addToFavorites,
  removeFromFavorites,
  getUserFavorites,
  isFavorited,
  getAllUsers,
  getUserStats,
};
