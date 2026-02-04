import React from 'react';
import { useUser } from '@clerk/clerk-react';

const Community = () => {
  const { user } = useUser();

  return (
    <div className="min-h-screen pt-28 px-6 md:px-16 lg:px-36 bg-[#0f0f0f] text-white">
      <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Movie Community</h1>
        <p className="text-gray-400 mb-8">
          Join the conversation! Discuss your favorite films and upcoming events with fellow fans.
        </p>

        {/* Placeholder for a Feed */}
        <div className="w-full space-y-6">
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold">JD</div>
              <div>
                <p className="font-medium">John Doe</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <p className="text-gray-300">Just watched the new Sci-Fi epic! The visuals were mind-blowing. Anyone else seen it yet?</p>
          </div>

          {!user && (
            <div className="p-6 bg-primary/10 border border-primary/20 rounded-xl">
              <p className="text-sm">Log in to join the discussion and share your thoughts!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Community;