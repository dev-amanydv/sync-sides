'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../../../store/useStore';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullname: "",
    username: "",
    password: "",
    email: "",
  });
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setUser = useStore(state => state.setUser);

  const handleSignup = async (e:any) => {
    e.preventDefault()
    console.log("button clicked")
    if (!formData.fullname.trim()) {
      alert("Please enter your name.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('http://localhost:4000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      setFormData({
        username: "",
        email: "",
        fullname: "",
        password: ""
      })
      const data = await res.json();

      if (data?.user?.id) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userName', data.user.username);
        setUser({
          userId: data.user.id,
          username: data.user.username
        });
        router.push('/dashboard'); // redirect after signup
      } else {
        setError(data?.error)
      }
    } catch (error:any) {
      console.error('Signup error:', error);
      setError(error.message || 'Something went wrong')
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6">
      <h1 className="text-2xl font-bold">Sign Up for SideRec</h1>
      <input
        type="text"
        value={formData.fullname}
        placeholder="Enter your full name"
        onChange={(e) => setFormData(prev => ({ ...prev, fullname: e.target.value }))}
        className="px-4 py-2 text-white border border-gray-300 rounded w-64"
      />
      <input
        type="text"
        value={formData.username}
        placeholder="Enter your username"
        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
        className="px-4 py-2 text-white border border-gray-300 rounded w-64"
      />
      <input
        type="email"
        value={formData.email}
        placeholder="Enter your email"
        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        className="px-4 py-2 text-white border border-gray-300 rounded w-64"
      />
      <input
        type="password"
        value={formData.password}
        placeholder="Enter your password"
        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
        className="px-4 text-white py-2 border border-gray-300 rounded w-64"
      />
      <button
        onClick={handleSignup}
        className="px-6 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Signing Up...' : 'Sign Up'}
      </button>
      <p className='text-red-600 text-sm'>{error}</p>
    </div>
  );
}
