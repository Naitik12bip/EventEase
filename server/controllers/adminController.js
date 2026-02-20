//import Booking from "../models/Booking.js"
//import Show from "../models/Show.js";
//import User from "../models/User.js";

import { supabase } from "../configs/db.js";
// API to check if user is admin
export const isAdmin = async (req, res) => {
  res.json({ success: true, isAdmin: true });
};

// API to get dashboard data
export const getDashboardData = async (req, res) => {
  try {
    const now = new Date().toISOString();

    const { data: bookings = [] } = await supabase
      .from('bookings')
      .select('total_amount, status')
      .eq('status', 'confirmed');

    const { data: activeShows = [] } = await supabase
      .from('shows')
      .select('*, movies(*)')
      .gte('show_date_time', now)
      .order('show_date_time', { ascending: true });

    const { count: totalUser = 0 } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const dashboardData = {
      totalBookings: bookings.length,
      totalRevenue: bookings.reduce((acc, booking) => acc + (booking.total_amount || 0), 0),
      activeShows,
      totalUser
    };

    res.json({ success: true, dashboardData });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get all shows
export const getAllShows = async (req, res) => {
  try {
    const { data: shows, error } = await supabase
      .from('shows')
      .select('*, movies(*)')
      .gte('show_date_time', new Date().toISOString())
      .order('show_date_time', { ascending: true });

    if (error) throw error;

    res.json({ success: true, shows: shows || [] });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get all bookings
export const getAllBookings = async (req, res) => {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*, profiles(*), shows(*, movies(*))')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, bookings: bookings || [] });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};