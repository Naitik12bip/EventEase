import { Link, useNavigate } from 'react-router-dom'; // Fix 1: Only need 'Link'
import React, { useState } from 'react'; // Fix 2: Import useState for mobile menu logic
import { assets } from '../assets/assets';
// Fix 3: Correct import for Lucide icons (must use destructuring)
import { Menu, Search, TicketPlus, X } from 'lucide-react';
import { useClerk, UserButton, useUser } from '@clerk/clerk-react';
import { useAppContext } from '../context/AddContext.jsx';

const Navbar = () => {
    // Fix 4: Add state to control the visibility of the mobile menu
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user } = useUser()
    const { openSignIn } = useClerk()
    const navigate = useNavigate()

    const { favoriteMovies } = useAppContext();

    return (
        /* Added 'h-20' to lock the height so it doesn't grow too big */
        <div className='fixed top-0 left-0 z-50 w-full h-20 flex items-center justify-between px-6 md:px-16 1g:px-36 py-5'>
            <Link to='/' className='max-md:flex-1'>
                {/* Added 'max-h-10' to ensure the logo doesn't stretch the navbar height */}
                <img src={assets.logo} alt="Logo" className='w-36 max-h-50 h-auto object-contain' />
            </Link>

            {/* Navigation Links - Mobile Menu Overlay */}
            <div
                className={`/* Mobile Overlay Settings */
                    max-md:fixed max-md:top-0 max-md:left-0 max-md:h-screen max-md:z-60
                    max-md:flex-col max-md:bg-black/60 max-md:backdrop-blur-lg
        
                    /* Desktop Floating Pill Settings */
                    md:static md:flex-row md:bg-white/10 md:border md:border-white/20 
                    md:rounded-full md:px-8 md:py-2.5 md:h-auto
        
                    /* Layout & Animation */
                    flex items-center justify-center gap-8 overflow-hidden 
                    transition-all duration-500 ease-in-out
        
                    /* Menu Toggle Logic */
                    ${isMenuOpen ? 'max-md:w-full opacity-100' : 'max-md:w-0 opacity-0 md:opacity-100'}
    `}
            >

                {/* Close Icon (X) for Mobile */}
                {/* Fix 6: Use the correct component name (X) and add click handler */}
                <X
                    className='md:hidden absolute top-6 right-6 w-6 h-6 cursor-pointer text-white'
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                />

                {/* Fix 7: Add click handlers to links to close the menu on navigation */}
                <Link to='/' onClick={() => { scrollTo(0, 0); setIsMenuOpen(false) }}>Home</Link>
                <Link to='/movies' onClick={() => { scrollTo(0, 0); setIsMenuOpen(false) }}>Movies</Link>
                <Link to='/' onClick={() => { scrollTo(0, 0); setIsMenuOpen(false) }}>Events</Link>
                <Link to='/' onClick={() => { scrollTo(0, 0); setIsMenuOpen(false) }}>Community</Link>
                { favoriteMovies.length > 0 && <Link to='/favorite' onClick={() => { scrollTo(0, 0); setIsMenuOpen(false) }}>Favorites</Link>}
            </div>

            {/* Added 'items-center' to ensure vertical alignment doesn't break */}
            <div className='flex items-center gap-8'> {/* Fix 8: Corrected 'items' to 'items-center' */}
                {/* Fix 9: Use the correct component name (Search) and fix class name typo */}
                <Search className='hidden md:block w-6 h-6 cursor-pointer' />

                {
                    !user ? (
                        <button onClick={openSignIn} className='px-4 py-1 sm:px-7 sm:py-2 bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer'>
                            Login
                        </button>
                    ) : (
                        <UserButton>
                            <UserButton.MenuItems>
                                <UserButton.Action label="My Bookings" labelIcon={<TicketPlus width={15} />} onClick={() => navigate('/My-Bookings')} />
                            </UserButton.MenuItems>
                        </UserButton>
                    )
                }


            </div>

            {/* Menu Icon for Mobile */}
            {/* Fix 10: Use the correct component name (Menu) and add click handler */}
            <Menu
                className='max-md:ml-4 md:hidden w-8 h-8 cursor-pointer'
                onClick={() => setIsMenuOpen(!isMenuOpen)} // Open menu on click
            />
        </div>
    );
};

// Fix 11: Remove colon from export statement
export default Navbar;