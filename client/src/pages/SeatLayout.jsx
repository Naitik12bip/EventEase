import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { dummyDateTimeData, dummyShowsData, assets } from '../assets/assets'
import Loading from '../components/Loading'
import { ArrowRightIcon, Clock } from 'lucide-react'
import BlurCircle from '../components/BlurCircle'
import toast from 'react-hot-toast'

const SeatLayout = () => {
  const groupRows = [["A", "B"], ["C", "D"], ["E", "F"], ["G", "H"], ["I", "J"]]
  const { id, date } = useParams()
  const [selectedSeats, setSelectedSeats] = useState([])
  const [selectedTime, setSelectedTime] = useState(null)
  const [show, setShow] = useState(null)
  const navigate = useNavigate()

  const handleSeatClick = (seatId) => {
    if (!selectedTime) {
      return toast("Please select time first")
    }
    if (!selectedSeats.includes(seatId) && selectedSeats.length > 4) {
      return toast("You can only select 5 seats")
    }
    setSelectedSeats(prev => prev.includes(seatId) ? prev.filter(seat => seat !== seatId) : [...prev, seatId])
  }

  const renderSeats = (row, count = 9) => (
    <div key={row} className='flex gap-2 mt-2'>
      <div className='flex flex-wrap items-center justify-center gap-2'>
        {Array.from({ length: count }, (_, i) => {
          const seatId = `${row}${i + 1}`;
          return (
            <button key={seatId} onClick={() => handleSeatClick(seatId)} className={`h-8 w-8 rounded border border-primary/60 cursor-pointer ${selectedSeats.includes(seatId) && "bg-primary text-white"}`}>
              {seatId}
            </button>
          );
        })}
      </div>
    </div>
  )

  useEffect(() => {
    // We use String() because your _id in assets is a string "324544"
    const foundShow = dummyShowsData.find(item => String(item._id) === String(id))
    if (foundShow) {
      setShow({
        movie: foundShow,
        dateTime: dummyDateTimeData
      })
    }
  }, [id])

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

        <button onClick={()=>navigate('/my-bookings')} className='flex items-center gap-1 mt-20 px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer active:scale-95'>
          Proceed To Checkout
          <ArrowRightIcon strokeWidth={3} className='w-4 h-4'/>
        </button>

      </div>
    </div>
  )
}

export default SeatLayout