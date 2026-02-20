import { useQuery } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';

// Get occupied seats for a show
export const useOccupiedSeats = (showId) => {
  const { user } = useUser();

  return useQuery({
    queryKey: ['occupied-seats', showId],
    queryFn: async () => {
      if (!showId) return {};

      // If showId is in the old format (show_YYYY-MM-DD_H), we need to convert it
      // For now, assume showId is already a UUID. If not, the frontend needs to be updated
      // to pass the actual UUID from the database

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/booking/seats/${showId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': user ? `Bearer ${await user.getToken()}` : '',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('Failed to fetch occupied seats:', response.status, response.statusText);
        throw new Error('Failed to fetch occupied seats');
      }

      const data = await response.json();
      return data.occupiedSeats || {};
    },
    enabled: !!showId,
    retry: 1,
    staleTime: 30000, // 30 seconds
  });
};
