"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

const SignupSchema = z
  .object({
    fullname: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof SignupSchema>;

export default function SignupForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SignupFormData>({
    resolver: zodResolver(SignupSchema),
  });
  const [loading, setLoading] = useState(false)
  const router = useRouter();

  const onSubmit = async (data: SignupFormData) => {
    setLoading(true)
    console.log("Form Data:", data);
    try {
      const res = await fetch("http://localhost:4000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
console.log(res)

      const result = await res.json();
      console.log(result)

      reset();
      if (!res.ok) {
        throw new Error("Signup failed");
      }
      router.push("/dashboard");
      console.log("Signup successful:", result);
    } catch (error) {
      console.error("Error during signup:", error);
    } finally{
      setLoading(false)
    }
  };
  <div className="min-h-screen w-full ">
  {/* Dark Sphere Grid Background */}
  <div
    className="absolute inset-0 z-0"
    style={{
      background: "#020617",
      backgroundImage: `
        linear-gradient(to right, rgba(71,85,105,0.3) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(71,85,105,0.3) 1px, transparent 1px),
        radial-gradient(circle at 50% 50%, rgba(139,92,246,0.15) 0%, transparent 70%)
      `,
      backgroundSize: "32px 32px, 32px 32px, 100% 100%",
    }}
  />
     {/* Your Content/Components */}
</div>

  return (
    <div
      className={`h-screen w-screen grid grid-cols-1 md:grid-cols-2`}

    >
      <div className={`col-span-1 relative flex justify-center items-center w-full  `} style={{
              background:
                "radial-gradient(ellipse 100% 100% at 50% 0%, #23323A, transparent 90%), #000000",
            }}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="max-w-lg w-full  mx-auto relative  px-5 py-5 rounded-2xl shadow space-y-4"
        >
          <h2 className="text-2xl text-white font-bold text-center">SignUp</h2>

          <div>
            <label className="block text-sm text-white font-medium">Name</label>
            <input
              {...register("fullname")}
              className="mt-1 w-full text-white rounded-lg border-white border p-2"
              placeholder="Enter your name"
            />
            {errors.fullname && (
              <p className="text-red-500 text-sm">{errors.fullname.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm text-white font-medium">Email</label>
            <input
              {...register("email")}
              className="mt-1 text-white border-white w-full border p-2 rounded-lg"
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm text-white font-medium">Password</label>
            <input
              type="password"
              {...register("password")}
              className="mt-1 text-white border-white w-full border p-2 rounded-lg"
              placeholder="Enter password"
            />
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-white text-sm font-medium">
              Confirm Password
            </label>
            <input
              type="password"
              {...register("confirmPassword")}
              className="mt-1 text-white border-white w-full border p-2 rounded-lg"
              placeholder="Confirm password"
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-white text-black py-2 rounded hover:bg-gray-400 transition"
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>
      </div>
      <div className={`col-span-1 bg-[url('/quote.jpg')] bg-no-repeat bg-center bg-cover`}>

      </div>
    </div>
  );
}
