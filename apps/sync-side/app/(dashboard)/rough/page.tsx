'use client';
import React from 'react';

const Page = () => {
  return (
    <div className="flex h-screen bg-black">
      {/* Main Video Area */}
      <div className="flex-1 relative flex items-center justify-center bg-gradient-to-br from-[#8b1d5f] to-[#b1447b]">
        <div className="text-white text-6xl bg-pink-500 w-20 h-20 rounded-full flex items-center justify-center">
          a
        </div>
        <div className="absolute bottom-4 left-4 text-white text-sm">aman</div>

        {/* Self Video Preview */}
        <div className="absolute bottom-4 right-4 w-40 h-28 rounded-md overflow-hidden">
          <div className="w-full h-full bg-black text-white flex items-center justify-center text-xs">
            (Your Video)
          </div>
        </div>

        {/* Mute Button */}
        <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#2f2f2f] text-white flex items-center justify-center text-sm">
          🔇
        </div>
      </div>

      {/* People Panel */}
      <div className="w-[350px] bg-white flex flex-col border-l border-gray-200">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-medium">People</h2>
          <button className="text-xl">✕</button>
        </div>

        <div className="p-4">
          <button className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-600 rounded-md text-sm mb-3">
            👥 Add people
          </button>
          <div className="relative">
            <input
              className="w-full px-3 py-2 border rounded-md text-sm"
              placeholder="Search for people"
            />
          </div>
        </div>

        <div className="px-4 py-2 text-xs text-gray-500">IN THE MEETING</div>
        <div className="px-4 text-sm text-gray-700 font-medium border-b pb-1">
          Contributors <span className="float-right">2</span>
        </div>

        {/* Participant List */}
        <div className="flex flex-col divide-y">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white text-sm">🛡️</div>
              <div>
                <div className="font-medium">Aman Yadav (You)</div>
                <div className="text-xs text-gray-500">Meeting host</div>
              </div>
            </div>
            <div className="text-xl">⋯</div>
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center">a</div>
              <div>
                <div className="font-medium">aman</div>
              </div>
            </div>
            <div className="text-xl">🔇</div>
          </div>
        </div>
      </div>

      {/* Bottom Toolbar */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center items-center gap-4 bg-[#111] px-6 py-3">
        <button className="text-white">⋯</button>
        <button className="text-white">🎥</button>
        <button className="text-white">🖥️</button>
        <button className="text-white">😊</button>
        <button className="text-white">✋</button>
        <button className="text-white">🔽</button>
        <button className="w-12 h-12 bg-red-600 rounded-full text-white flex items-center justify-center text-xl">⛔</button>
        <div className="ml-auto text-white text-xs flex items-center gap-2">
          <span>🕐 1:14 PM</span> | <span>znz-zsvi-zrk</span>
        </div>
      </div>
    </div>
  );
};

export default Page;
