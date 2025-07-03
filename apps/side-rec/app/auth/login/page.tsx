"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "../../../store/useStore";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const setUser = useStore((state) => state.setUser);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!formData.username.trim() || !formData.password.trim()) {
      setError("Username and password are required");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || "Invalid credentials");
        return;
      }

      const data = await res.json();
      // Persist login
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("userName", data.user.username);

      setUser({
        userId: data.user.id,
        username: data.user.username,
      });

      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen grid grid-cols-2 h-screen">
      <div className="w-full h-screen flex justify-center items-center ">
        <form onSubmit={handleLogin} className="flex min-w-96 flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="">Username</h1>
            <input
            type="text"
            placeholder="Username"
            value={formData.username}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, username: e.target.value }))
            }
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
          </div>
          <div className="flex flex-col gap-2">
            <h1>Password</h1>
            <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, password: e.target.value }))
            }
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
          </div>
          
          

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 my-5 rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
          <p className="text-sm text-center">
            Don&apos;t have an account?{" "}
            <a href="/auth/signup" className="text-blue-600 underline">
              Sign up
            </a>
          </p>
        </form>
      </div>

      <div className="overflow-hidden">
        <img src="/rough.jpeg" alt=" h-screen" />
      </div>
    </div>
  );
}
