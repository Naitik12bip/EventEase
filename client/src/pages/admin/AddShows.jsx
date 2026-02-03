import React, { useEffect, useState } from "react";
import Loading from "../../components/Loading.jsx";
import Title from "../../components/admin/Title.jsx";
import { CheckIcon, DeleteIcon } from "lucide-react";
import { useAppContext } from "../../context/AddContext.jsx";
import toast from "react-hot-toast";

const AddShows = () => {
  const { axios, getToken, user } = useAppContext();

  const currency = import.meta.env.VITE_CURRENCY;

  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [dateTimeSelection, setDateTimeSelection] = useState({});
  const [dateTimeInput, setDateTimeInput] = useState("");
  const [showPrice, setShowPrice] = useState("");
  const [addingShow, setAddingShow] = useState(false);

  // ✅ FETCH OMDb MOVIES
  const fetchMovies = async () => {
    try {
      const { data } = await axios.get("/show/search?query=batman", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) {
        setMovies(data.movies);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch movies");
    }
  };

  const handleDateTimeAdd = () => {
    if (!dateTimeInput) return;
    const [date, time] = dateTimeInput.split("T");

    setDateTimeSelection((prev) => ({
      ...prev,
      [date]: [...(prev[date] || []), time],
    }));
  };

  const handleRemoveTime = (date, time) => {
    setDateTimeSelection((prev) => {
      const filtered = prev[date].filter((t) => t !== time);
      if (!filtered.length) {
        const { [date]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [date]: filtered };
    });
  };

  // ✅ SUBMIT SHOW
  const handleSubmit = async () => {
    if (!selectedMovie || !showPrice || !Object.keys(dateTimeSelection).length) {
      return toast.error("Missing required fields");
    }

    try {
      setAddingShow(true);

      const showsInput = Object.entries(dateTimeSelection).map(
        ([date, time]) => ({ date, time })
      );

      const payload = {
        movieId: selectedMovie,
        showsInput,
        showPrice: Number(showPrice),
      };

      const { data } = await axios.post("/show/add", payload, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) {
        toast.success(data.message);
        setSelectedMovie(null);
        setDateTimeSelection({});
        setShowPrice("");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to add show");
    }

    setAddingShow(false);
  };

  useEffect(() => {
    if (user) fetchMovies();
  }, [user]);

  return movies.length ? (
    <>
      <Title text1="Add" text2="Shows" />

      <p className="mt-10 text-lg font-medium">Movies</p>

      <div className="flex flex-wrap gap-4 mt-4">
        {movies.map((movie) => (
          <div
            key={movie.imdbID}
            onClick={() => setSelectedMovie(movie.imdbID)}
            className="w-40 cursor-pointer relative"
          >
            <img
              src={movie.Poster}
              alt={movie.Title}
              className="rounded"
            />

            {selectedMovie === movie.imdbID && (
              <div className="absolute top-2 right-2 bg-primary h-6 w-6 flex items-center justify-center rounded">
                <CheckIcon className="text-white w-4 h-4" />
              </div>
            )}

            <p className="truncate font-medium">{movie.Title}</p>
            <p className="text-gray-400 text-sm">{movie.Year}</p>
          </div>
        ))}
      </div>

      {/* PRICE */}
      <div className="mt-8">
        <label>Show Price</label>
        <div className="flex items-center gap-2">
          <span>{currency}</span>
          <input
            type="number"
            value={showPrice}
            onChange={(e) => setShowPrice(e.target.value)}
          />
        </div>
      </div>

      {/* DATE TIME */}
      <div className="mt-6">
        <input
          type="datetime-local"
          value={dateTimeInput}
          onChange={(e) => setDateTimeInput(e.target.value)}
        />
        <button onClick={handleDateTimeAdd}>Add Time</button>
      </div>

      {Object.keys(dateTimeSelection).length > 0 && (
        <div className="mt-6">
          {Object.entries(dateTimeSelection).map(([date, times]) => (
            <div key={date}>
              <p>{date}</p>
              {times.map((time) => (
                <div key={time} className="flex items-center">
                  <span>{time}</span>
                  <DeleteIcon
                    onClick={() => handleRemoveTime(date, time)}
                    className="ml-2 cursor-pointer"
                    size={14}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <button onClick={handleSubmit} disabled={addingShow}>
        Add Show
      </button>
    </>
  ) : (
    <Loading />
  );
};

export default AddShows;
