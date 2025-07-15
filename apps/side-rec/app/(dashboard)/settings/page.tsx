'use client'
import React, { useState } from 'react';

export default function SettingsPage() {
  const [theme, setTheme] = useState('dark');
  const [recordingQuality, setRecordingQuality] = useState('1080p Full HD');

  return (
    <div className="min-h-screen bg-[#000] text-white p-8 space-y-6">
      <h1 className="text-2xl font-semibold mb-2">Settings</h1>
      <p className="text-gray-500 mb-6">Manage your application preferences and recording settings</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appearance */}
        <div className="bg-[#0A0A0A] border-[1px] border-[#2C2C2C] rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold">Appearance</h2>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Theme</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full bg-[#000] text-white border border-gray-600 rounded-md px-4 py-2"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
        </div>

        {/* Recording Settings */}
        <div className="bg-[#0A0A0A] border-[1px] border-[#2C2C2C] rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold">Recording Settings</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto-start recording</p>
              <p className="text-sm text-gray-400">Automatically start recording when joining a meeting</p>
            </div>
            <label className="switch">
                  <input type="checkbox"/>
                  <span className="slider"></span>
              </label>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Recording Quality</label>
            <select
              value={recordingQuality}
              onChange={(e) => setRecordingQuality(e.target.value)}
              className="w-full bg-[#000] text-white border border-gray-600 rounded-md px-4 py-2"
            >
              <option value="1080p Full HD">1080p Full HD</option>
              <option value="720p HD">720p HD</option>
              <option value="480p SD">480p SD</option>
            </select>
          </div>
        </div>

        {/* Audio/Video Defaults */}
        <div className="bg-[#0A0A0A] border-[1px] border-[#2C2C2C] rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold">Audio/Video Defaults</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Microphone on by default</p>
              <p className="text-sm text-gray-400">Enable microphone when joining meetings</p>
            </div>
            <label className="switch">
                  <input type="checkbox"/>
                  <span className="slider"></span>
              </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Camera on by default</p>
              <p className="text-sm text-gray-400">Enable camera when joining meetings</p>
            </div>
              <label className="switch">
                  <input type="checkbox"/>
                  <span className="slider"></span>
              </label>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="bg-[#0A0A0A] border-[1px] border-[#2C2C2C] rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold">Advanced Settings</h2>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Storage Location</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value="~/Downloads/SideRec"
                readOnly
                className="flex-grow bg-[#000] text-white border border-gray-600 rounded-md px-4 py-2"
              />
              <button className="bg-gray-700 px-4 py-2 rounded-md text-white">Change</button>
            </div>
          </div>
          <div className="text-sm text-gray-400 space-y-1">
            <p>Total recordings: 18</p>
            <p>Storage used: 1.2 GB</p>
            <p>Average file size: 67 MB</p>
          </div>
          <button className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-md">
            Clear All Recordings
          </button>
        </div>
      </div>

      <div className="pt-6">
        <button className="bg-white text-black font-medium px-6 py-2 rounded-md">
          Save All Settings
        </button>
      </div>
    </div>
  );
}
