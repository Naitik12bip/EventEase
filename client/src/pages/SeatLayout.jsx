import React, { use, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { dummyDateTimeData, dummyShowsData, assets } from '../assets/assets'
import Loading from '../components/Loading'
import { ArrowRightIcon, Clock } from 'lucide-react'
import BlurCircle from '../components/BlurCircle'
import toast from 'react-hot-toast'
import { useAppContext } from '../context/AddContext'

const SeatLayout = () => {
  const groupRows = [["A", "B"], ["C", "D"], ["E", "F"], ["G", "H"], ["I", "J"]]
  const { id, date } = useParams()
  const [selectedSeats, setSelectedSeats] = useState([])
  const [selectedTime, setSelectedTime] = useState(null)
  const [show, setShow] = useState(null)
  const [occupiedSeats, setOccupiedSeats] = useState([]);

  const navigate = useNavigate()

  const { axios, getToken, user } = useAppContext();

  const getShow = async () => {
    try {
      const { data } = await axios.get(`/api/show/${id}`);

      if (data.success) {
        setShow(data)
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };


  const handleSeatClick = (seatId) => {
    if (!selectedTime) {
      return toast("Please select time first")
    }
    if (!selectedSeats.includes(seatId) && selectedSeats.length > 4) {
      return toast("You can only select 5 seats")
    }
    if (occupiedSeats.includes(seatId)) {
      return toast('This seat is already booked')
    }
    setSelectedSeats(prev => prev.includes(seatId) ? prev.filter(seat => seat !== seatId) : [...prev, seatId])
  }

  const renderSeats = (row, count = 9) => (
    <div key={row} className='flex gap-2 mt-2'>
      <div className='flex flex-wrap items-center justify-center gap-2'>
        {Array.from({ length: count }, (_, i) => {
          const seatId = `${row}${i + 1}`;
          return (
            <button key={seatId} onClick={() => handleSeatClick(seatId)} className={`h-8 w-8 rounded border border-primary/60 cursor-pointer 
            ${selectedSeats.includes(seatId) && "bg-primary text-white"} : ${occupiedSeats.includes(seatId) && "opacity-50"}`}>
              {seatId}
            </button>
          );
        })}
      </div>
    </div>
  )

  const getOccupiedSeats = async () => {
    try {
      const { data } = await axios.get(`/api/booking/seats/${selectedTime.showId}`)

      if (data.success) {
        setOccupiedSeats(data.occupiedSeats)
      } else {
        toast.error(data.message)
      }
    } catch {
      console.log(error);
    }
  }

  const bookTickets = async () => {
    try {
      if (!user) {
        return toast.error("Please login to proceed");
      }

      if (!selectedTime || !selectedSeats.length) {
        return toast.error("Please select a time and seats");
      }

      const { data } = await axios.post(
        "/api/booking/create",
        {
          showId: selectedTime.showId,
          selectedSeats
        },
        {
          headers: {
            Authorization: `Bearer ${await getToken()}`
          }
        }
      );

      if (data.success) {
        toast.success(data.message)
        navigate('/my-bookings')
      } else {
        toast.error(data.success)
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const loadRazorpay = () =>
    new Promise(resolve => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const payNow = async () => {
    const res = await loadRazorpay();
    if (!res) return toast.error("Razorpay failed to load");

    const { data } = await axios.post("/api/payment/create-order", {
      amount: 500 // example amount
    });

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: data.order.amount,
      currency: "INR",
      order_id: data.order.id,
      name: "Movie Booking",
      description: "Ticket Payment",
      handler: function (response) {
        toast.success("Payment Successful 🎉");
        console.log(response);
      },
      theme: { color: "#7c3aed" }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };



  useEffect(() => {
    getShow();
  }, []);

  useEffect(() => {
    if (selectedTime) {
      getOccupiedSeats()
    }
  }, [selectedTime])


  if (!show) return <Loading />

  return (
    <div className='flex flex-col md:flex-row px-6 md:px-16 lg:px-40 py-32 gap-10 min-h-screen'>

      {/* LEFT SIDE: AVAILABLE TIMINGS */}
      <div className='w-full md:w-64 bg-primary/5 border border-primary/10 rounded-xl py-8 h-max'>
        <h3 className='text-lg font-bold px-6 mb-5 flex items-center gap-2'>
          <Clock className='w-5 h-5 text-primary' /> Timings
        </h3>

        <div className='flex flex-col gap-1'>
          {show.dateTime[date] ? (
            show.dateTime[date].map((item, index) => (
              <div
                key={index}
                onClick={() => setSelectedTime(item)}
                className={`px-6 py-3 cursor-pointer transition-all border-l-4 ${selectedTime?.showId === item.showId ? "bg-primary text-white border-primary" : "hover:bg-primary/10 border-transparent text-gray-600"}`}
              >
                <p className='text-sm font-medium'>
                  {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))
          ) : (
            <p className='px-6 text-red-500 text-xs italic'>No shows found for this date.</p>
          )}
        </div>
      </div>

      {/* RIGHT SIDE: SEAT SELECTION */}
      <div className='relative flex-1 flex flex-col items-center max-md:mt-16'>
        <BlurCircle top='-100px' left='-100px' />
        <BlurCircle bottom='0' right='0' />
        <h1 className='text-2xl font-semibold mb-4'>
          Select Your Seat
        </h1>

        <img src={assets.screenImage} alt="screen" />
        <p className='text-gray-400 text-sm mb-6'>
          Screen Side
        </p>

        <div className='flex flex-col items-center mt-10 text-xs text-gray-300'>
          <div className='grid grid-cols-2 md:grid-cols-1 gap-8 md:gap-2 mb-6'>
            {groupRows[0].map(row => renderSeats(row))}
          </div>

          <div className='grid grid-cols-2 gap-11'>
            {groupRows.slice(1).map((group, idx) => (
              <div key={idx} className=''>
                {group.map(row => renderSeats(row))}
              </div>
            ))}
          </div>
        </div>

        <button onClick={bookTickets} className='flex items-center gap-1 mt-20 px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer active:scale-95'>
          Proceed To Checkout
          <ArrowRightIcon strokeWidth={3} className='w-4 h-4' />
        </button>

      </div>
    </div>
  )
}

export default SeatLayout