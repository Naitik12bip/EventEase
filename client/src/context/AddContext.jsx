import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

axios.defaults.baseURL =
    import.meta.env.VITE_BASE_URL || "http://localhost:3000/api";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {

    const [isAdmin, setIsAdmin] = useState(false);
    const [shows, setShows] = useState([]); // ✅ renamed to match usage
    const [favoriteMovies, setFavoriteMovies] = useState([]);

    const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;

    const { user } = useUser();
    const { getToken } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const fetchIsAdmin = async () => {
        try {
            const token = await getToken();
            if (!token) return;

            const { data } = await axios.get("/admin/is-admin", {
                headers: { Authorization: `Bearer ${token}` }
            });

            setIsAdmin(data.isAdmin);

            if (!data.isAdmin && location.pathname.startsWith("/admin")) {
                navigate("/");
                toast.error("You are not authorized to access Admin Dashboard.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchShows = async () => {
        try {
            const { data } = await axios.get("/show/all");
            if (data.success) {
                setShows(data.shows);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchFavoriteMovies = async () => {
        try {
            const token = await getToken();
            if (!token) return;

            const { data } = await axios.get("/user/favorites", {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                setFavoriteMovies(data.movies);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchShows();
    }, []);

    useEffect(() => {
        if (user) {
            fetchIsAdmin();
            fetchFavoriteMovies();
        }
    }, [user, location.pathname]); // ✅ safe dependency

    const value = {
        axios,
        fetchIsAdmin,
        user,
        getToken,
        navigate,
        isAdmin,
        shows,              // ✅ now matches components
        favoriteMovies,
        fetchFavoriteMovies,
        image_base_url
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);
