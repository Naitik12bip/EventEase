import axios from "axios";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL

export const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;