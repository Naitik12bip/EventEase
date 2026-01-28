import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:3000/api";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {

    const [isAdmin, setIsAdmin] = useState(false);
    const [show, setShow] = useState([]);
    const [favoriteMovies, setFavoriteMovies] = useState([]);

    const { user } = useUser();
    const { getToken } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const fetchIsAdmin = async (userId) => {
        try {
            const { data } = await axios.get('/api/admin/is-admin', { 
                headers: { Authorization: `Bearer ${await getToken()}` }
            });
            setIsAdmin(data.isAdmin);

            if (!data.isAdmin && location.pathname.startsWith('/admin')) {
                navigate('/');
                toast.error("You are not authorized to access Admin Dashboard.");
            }
        } catch (error) {
            console.error(error);
        }
    }

    const fetchShows = async () => {
        try {
            const { data } = await axios.get('/api/show/all');
            if (data.success) {
                setShow(data.shows);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error);
        }
    }

    const fetchFavoriteMovies = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get('/api/user/favorites', { 
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
    }

    useEffect(() => {
        fetchShows();
    }, []);

    useEffect(() => {
        if (user) {
            fetchIsAdmin(user.id);  // Ensure user.id is passed
            fetchFavoriteMovies();   // Fetch favorite movies when user is available
        }
    }, [user]);  // Depend on `user` to re-run the effect

    const value = { 
        axios,
        fetchIsAdmin,
        user, 
        getToken, 
        navigate, 
        isAdmin, 
        show,           // Corrected here from `shows`
        favoriteMovies, 
        fetchFavoriteMovies
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

export const useAppContext = () => useContext(AppContext);
