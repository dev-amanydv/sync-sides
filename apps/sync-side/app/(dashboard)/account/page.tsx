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
      if (!userId) return;

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/stats`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: Number(userId) }),
        });

        const data = await res.json();

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

  const cardClass =
    "rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6";
  const inputClass =
    "w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-[14px] text-[#F7F8F8] placeholder:text-[#5C616B] outline-none transition-colors focus:border-[#5E6AD2]";

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl animate-pulse px-4 py-6 md:px-6">
        <div className="mb-2 h-7 w-40 rounded bg-white/[0.06]" />
        <div className="mb-8 h-4 w-72 rounded bg-white/[0.04]" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 lg:col-span-2">
            <div className="h-5 w-56 rounded bg-white/[0.06]" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 rounded bg-white/[0.05]" />
                <div className="h-10 rounded bg-white/[0.04]" />
              </div>
            ))}
            <div className="h-10 w-36 rounded bg-white/[0.06]" />
          </div>
          <div className="space-y-6">
            <div className="space-y-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
              <div className="mx-auto h-20 w-20 rounded-full bg-white/[0.05]" />
            </div>
            <div className="space-y-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              {[...Array(3)].map((_, idx) => (
                <div className="flex justify-between" key={idx}>
                  <div className="h-4 w-32 rounded bg-white/[0.05]" />
                  <div className="h-4 w-12 rounded bg-white/[0.04]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-[-0.01em] md:text-2xl">Profile</h1>
        <p className="mt-1 text-[13px] text-[#8A8F98] md:text-sm">
          Manage your account details.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Personal Info Form */}
        <div className={`${cardClass} lg:col-span-2`}>
          <h2 className="mb-5 text-[15px] font-medium">Personal Information</h2>

          <form className="space-y-4" onSubmit={handleSave}>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[#D0D3D9]">
                Full Name
              </label>
              <input
                type="text"
                value={updateData.fullname}
                onChange={(e) => setUpdateData((prev) => ({ ...prev, fullname: e.target.value }))}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[#D0D3D9]">
                Email Address
              </label>
              <input
                type="email"
                value={updateData.email}
                onChange={(e) => setUpdateData((prev) => ({ ...prev, email: e.target.value }))}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[#D0D3D9]">
                Member Since
              </label>
              <input
                type="text"
                value={stats.createdAt}
                disabled
                className={`${inputClass} cursor-not-allowed text-[#8A8F98] opacity-70`}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex h-10 items-center justify-center rounded-lg bg-[#5E6AD2] px-5 text-[14px] font-medium text-white transition-colors hover:bg-[#6E79D6] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Right Side Panels */}
        <div className="space-y-6">
          {/* Profile Picture */}
          <div className={`${cardClass} flex flex-col items-center text-center`}>
            <Image
              src={user.profilePic || '/default-avatar.png'}
              alt="Profile"
              width={80}
              height={80}
              className="rounded-full object-cover"
            />
            <p className="mt-3 text-[14px] font-medium text-[#F7F8F8]">
              {stats.fullname || user.fullname}
            </p>
            <p className="mt-0.5 text-[12px] text-[#8A8F98]">{stats.email || user.email}</p>
          </div>

          {/* Account Stats */}
          <div className={cardClass}>
            <h2 className="mb-4 text-[15px] font-medium">Account Stats</h2>
            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between">
                <span className="text-[#8A8F98]">Meetings Hosted</span>
                <span className="font-medium text-[#F7F8F8]">{stats.meetingsHosted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A8F98]">Meetings Joined</span>
                <span className="font-medium text-[#F7F8F8]">{stats.participants}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A8F98]">Plan</span>
                <span className="rounded-full bg-[#5E6AD2]/15 px-2 py-0.5 text-[12px] font-medium text-[#8C93E8]">
                  Free
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;