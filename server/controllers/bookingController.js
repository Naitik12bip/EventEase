// Function to check availabilty of selected seate for a movie

import Booking from "../models/Booking.js";
import Show from "../models/Show.js";

const checkSeatAvailability = async (showId, selectedSeats) => {
    try {
        const showData = await Show.findById(showId);
        if(!showData) return false;

        const occupiedSeats = showData.occupiedSeats;

        const isAnySeatTaken = selectedSeats.some(seat => occupiedSeats[seat]);
        return !isAnySeatTaken;
    } catch (err) {
        console.error(err);
        return false;
    }
}

export const createBooking = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { showId, selectedSeats } = req.body;
        const{ origin } = req.headers;

        // check if the seat is available for the selected show
        const isAvailable = await checkSeatAvailability(showId, selectedSeats);
        if(!isAvailable){
            return res.json({success: false, message: "Selected Seats are Not Available."});
        }

        // get the show details
        const showData = await Show.findById(showId).populate('movie');
        // create a new booking
        const booking = await Booking.create({
            user: userId,
            show: showId,
            amount: showData.showPrice * selectedSeats.length,
            bookedSeats: selectedSeats,
        })

        selectedSeats.map((seat)=> {
            showData.occupiedSeats[seat] = userId;
        })

        showData.markModified('occupiedSeats');
        await showData.save();

        //Stripe GateWay Initialize

        res.json({ success: true, message: "Booking Successfully" });

        
    } catch (err) {
        console.error(err.message);
        res.json({ success: false, message: "Selected Seats are Not Available." });
    }
}

export const getOccupiedSeats = async (req, res) => {
    try{
        const { showId } = req.params;
        const showData = await Show.findById(showId);

        const occupiedSeats = Object.keys(showData.occupiedSeats);
        res.json({ success: true, occupiedSeats });
        
    } catch(err){
        console.log(err.message);
        res.json({ success: false, message: err.message });
    }
}