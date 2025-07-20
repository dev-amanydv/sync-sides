'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';

type Stats = {
  email: string;
  fullname: string;
  createdAt: string; // converted to string for formatting
  id: number;
  image?: string;
  meetingsHosted: number;
  participants: number;
};

const AccountPage = () => {
  const { data: session } = useSession();

  const [user, setUser] = useState({
    userId: '',
    fullname: '',
    email: '',
    profilePic: '',
  });

  const [stats, setStats] = useState<Stats>({
    email: '',
    fullname: '',
    createdAt: '',
    id: 0,
    image: '',
    meetingsHosted: 0,
    participants: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updateData, setUpdateData] = useState({
    fullname: '',
    email: '',
  });

  const userId = user.userId;

  // Set session data
  useEffect(() => {
    if (session?.user) {
      setUser({
        userId: session.user.id ?? '',
        fullname: session.user.name ?? '',
        email: session.user.email ?? '',
        profilePic: session.user.image ?? '',
      });

      setUpdateData({
        fullname: session.user.name ?? '',
        email: session.user.email ?? '',
      });
    }
  }, [session]);

  // Fetch stats
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        console.log('userId is required:', userId);
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/stats`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: Number(userId) }),
        });

        const data = await res.json();
        console.log('data of stats: ', data);

        setStats({
          email: data.user.email,
          fullname: data.user.fullname,
          createdAt: new Date(data.user.createdAt).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          }),
          id: data.user.id,
          image: data.user.image ?? '',
          meetingsHosted: data.user.meetingsHosted.length,
          participants: data.user.participants.length,
        });
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: Number(userId),
          fullname: updateData.fullname,
          email: updateData.email,
        }),
      });

      if (res.ok) {
        alert('Profile updated successfully');
      } else {
        alert('Failed to update profile');
      }
    } catch (err) {
      alert('Error updating profile');
      console.log("error : ", err)
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 bg-[#000] min-h-screen text-gray-200 animate-pulse">
        <h1 className="text-2xl font-semibold mb-2 bg-gray-700 rounded w-40 h-6"></h1>
        <p className="text-gray-500 mb-6 bg-gray-800 rounded w-72 h-4"></p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Form Skeleton */}
          <div className="col-span-2 bg-[#0A0A0A] p-6 rounded-lg border border-[#2C2C2C] space-y-4">
            <div className="h-5 bg-gray-700 rounded w-56"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-600 rounded w-24"></div>
              <div className="h-10 bg-gray-800 rounded"></div>

              <div className="h-4 bg-gray-600 rounded w-24"></div>
              <div className="h-10 bg-gray-800 rounded"></div>

              <div className="h-4 bg-gray-600 rounded w-24"></div>
              <div className="h-10 bg-gray-800 rounded"></div>

              <div className="h-9 bg-gray-700 rounded w-36"></div>
            </div>
          </div>

          {/* Right Side Skeleton */}
          <div className="space-y-6">
            {/* Profile Picture Skeleton */}
            <div className="bg-[#0A0A0A] p-6 rounded-lg border border-[#2C2C2C] text-center space-y-4">
              <div className="h-5 bg-gray-700 rounded w-40 mx-auto"></div>
              <div className="w-20 h-20 mx-auto bg-gray-800 rounded-full"></div>
              <div className="h-9 bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-800 rounded w-1/2 mx-auto"></div>
            </div>

            {/* Stats Skeleton */}
            <div className="bg-[#0A0A0A] p-6 rounded-lg border border-[#2C2C2C] space-y-4">
              <div className="h-5 bg-gray-700 rounded w-32"></div>
              {[...Array(4)].map((_, idx) => (
                <div className="flex justify-between" key={idx}>
                  <div className="h-4 bg-gray-600 rounded w-32"></div>
                  <div className="h-4 bg-gray-800 rounded w-12"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-[#000] min-h-screen text-gray-200">
      <h1 className="text-2xl font-semibold mb-2">Profile</h1>
      <p className="text-gray-500 mb-6">Manage your account settings and preferences</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Info Form */}
        <div className="col-span-2 bg-[#0A0A0A] p-6 rounded-lg border-[1px] border-[#2C2C2C]">
          <h2 className="text-lg font-medium mb-4">👤 Personal Information</h2>

          <form className="space-y-4" onSubmit={handleSave}>
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                type="text"
                value={updateData.fullname}
                onChange={(e) => setUpdateData((prev) => ({ ...prev, fullname: e.target.value }))}
                className="w-full border rounded px-3 py-2 text-sm bg-[#111] text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email Address</label>
              <input
                type="email"
                value={updateData.email}
                onChange={(e) => setUpdateData((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full border rounded px-3 py-2 text-sm bg-[#111] text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Member Since</label>
              <input
                type="text"
                value={stats.createdAt}
                disabled
                className="w-full bg-gray-900 text-gray-400 border rounded px-3 py-2 text-sm cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="text-gray-900 flex cursor-pointer rounded-md hover:bg-gray-400  gap-2 items-center border-[1px] bg-gray-200 border-[#2C2C2C] px-4 py-1.5"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Right Side Panels */}
        <div className="space-y-6">
          {/* Profile Picture */}
          <div className="bg-[#0A0A0A] p-6 rounded-lg border-[1px] border-[#2C2C2C] text-center">
            <h2 className="text-lg font-semibold mb-4">Profile Picture</h2>
            <div className="flex justify-center mb-4">
              <Image
                src={user.profilePic || '/default-avatar.png'}
                alt="Profile"
                width={80}
                height={80}
                className="rounded-full object-cover"
              />
            </div>
            <button className="w-full bg-[#0A0A0A] p-6 rounded-lg border-[1px] border-[#2C2C2C] py-2 text-sm hover:bg-gray-800">
              Change Photo
            </button>
            <button className="w-full py-2 text-sm text-red-500 mt-2 hover:underline">
              Remove Photo
            </button>
          </div>

          {/* Account Stats */}
          <div className="bg-[#0A0A0A] p-6 rounded-lg border-[1px] border-[#2C2C2C]">
            <h2 className="text-lg font-semibold mb-4">Account Stats</h2>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span>Total Meetings</span>
                <span className="font-semibold">{stats.meetingsHosted}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Participants</span>
                <span className="font-semibold">{stats.participants}</span>
              </div>
              <div className="flex justify-between">
                <span>Storage Used</span>
                <span className="font-semibold">1.2 GB</span>
              </div>
              <div className="flex justify-between">
                <span>Plan</span>
                <span className="font-semibold">Free</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;