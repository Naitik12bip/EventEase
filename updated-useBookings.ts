import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useUser } from '@clerk/clerk-react';

// Get user bookings
export const useUserBookings = () => {
  const { user } = useUser();

  return useQuery({
    queryKey: ['user-bookings', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/user/bookings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getToken()}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      return response.json();
    },
    enabled: !!user?.id,
  });
};

// Create Razorpay order
export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({ showId, seats, amount }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/payment/create-razorpay-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getToken()}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          showId,
          seats,
          amount,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
    },
  });
};

// Verify Razorpay payment
export const useVerifyPayment = () => {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingData }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/payment/verify-razorpay-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getToken()}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          bookingData,
        }),
      });

      if (!response.ok) {
        throw new Error('Payment verification failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
    },
  });
};

// Create booking
export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({ showId, seats, amount, razorpayOrderId }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/booking/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getToken()}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          showId,
          seats,
          amount,
          razorpayOrderId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create booking');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
    },
  });
};
