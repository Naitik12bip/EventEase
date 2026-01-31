import React, { useState } from 'react'
import BlurCircle from './BlurCircle'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const DateSelect = ({ dateTime = {}, id }) => {
    const navigate = useNavigate()
    const [selected, setSelected] = useState(null)

    const onBookHandling = () => {
        if (!selected) {
            return toast.error("Please Select a Date!!!")
        }
        navigate(`/movies/${id}/${selected}`)
        window.scrollTo(0, 0)
    }

    return (
        <div id='dateSelect' className='pt-30'>
            <div className='flex flex-col md:flex-row items-center justify-between gap-10 relative p-8 bg-primary/10 border border-primary/20 rounded-lg'>
                <BlurCircle top="-100px" left="-100px" />

                <div>
                    <p className='text-lg font-semibold'>Choose Date</p>
                    <div className='flex items-center gap-6 text-sm mt-5'>
                        <ChevronLeftIcon width={28} className="cursor-pointer" />

                        <span className='grid grid-cols-3 md:flex flex-wrap md:max-w-lg gap-4'>
                            {Object.keys(dateTime).map((date) => (
                                <button
                                    key={date}
                                    onClick={() => setSelected(date)}
                                    className={`flex flex-col items-center justify-center h-16 w-16 rounded transition-all ${
                                        selected === date
                                            ? "bg-primary text-white"
                                            : "border border-primary/30 text-gray-600 hover:border-primary"
                                    }`}
                                >
                                    <span className='text-xs'>
                                        {new Date(date).toLocaleDateString("en-US", { month: "short" })}
                                    </span>
                                    <span className='text-lg font-bold'>
                                        {new Date(date).getDate()}
                                    </span>
                                </button>
                            ))}
                        </span>

                        <ChevronRightIcon width={28} className="cursor-pointer" />
                    </div>
                </div>

                <button
                    onClick={onBookHandling}
                    className='bg-primary text-white px-10 py-3 rounded-md font-semibold hover:bg-primary/90 transition active:scale-95'
                >
                    Book Now
                </button>
            </div>
        </div>
    )
}

export default DateSelect
