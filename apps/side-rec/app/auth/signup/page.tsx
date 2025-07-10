"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";

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
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState("")
  const router = useRouter();

  const onSubmit = async (data: SignupFormData) => {
    setLoading(true);
    console.log("Form Data:", data);
    try {
      const res = await fetch("http://localhost:4000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      console.log(result);

      if (!res.ok) {
        setLog(result.error)
        console.log("Log: ", result.error)
        throw new Error("Signup failed");
      }
      reset();
      router.push("/dashboard");
      console.log("Signup successful:", result);
    } catch (error) {
      console.error("Error during signup:", error);
    } finally {
      setLoading(false);
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
  </div>;

  return (
    <div className={`h-screen w-screen grid grid-cols-1 md:grid-cols-2`}>
      <div
        className={`col-span-1 relative flex justify-center items-center w-full  `}
        style={{
          background:
            "radial-gradient(ellipse 100% 100% at 50% 0%, #23323A, transparent 90%), #000000",
        }}
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="max-w-lg w-full flex justify-center gap-10 items-center flex-col   mx-auto relative  px-5 py-5 rounded-2xl shadow space-y-4"
        >
          <div>
          <div className="flex flex-col justify-center items-center">
            <Image src={"/logo.svg"} width={400} height={200} alt="logo" />
            <h1 className="text-xl text-gray-300">Welcomes You!</h1>
          </div>
          <div className="w-full max-w-lg flex flex-col gap-5">
            <div>
              <label className="block text-sm text-gray-300 font-medium">
                Name
              </label>
              <input
                {...register("fullname")}
                className="mt-1 w-full text-gray-300 rounded-lg border-gray-300 border p-2"
                placeholder="Enter your name"
              />
              {errors.fullname && (
                <p className="text-red-500 text-sm">
                  {errors.fullname.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-gray-300 font-medium">
                Email
              </label>
              <input
                {...register("email")}
                className="mt-1 text-gray-300 border-gray-300 w-full border p-2 rounded-lg"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-gray-300 font-medium">
                Password
              </label>
              <input
                type="password"
                {...register("password")}
                className="mt-1 text-gray-300 border-gray-300 w-full border p-2 rounded-lg"
                placeholder="Enter password"
              />
              {errors.password && (
                <p className="text-red-500 text-sm">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-gray-300 text-sm font-medium">
                Confirm Password
              </label>
              <input
                type="password"
                {...register("confirmPassword")}
                className="mt-1 text-gray-300 border-gray-300 w-full border p-2 rounded-lg"
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
              className="w-full mt-5 bg-white text-black py-2 rounded hover:bg-gray-400 transition"
            >
              {loading ? "Signing Up..." : "Sign Up"}
            </button>
            
            <p className="text-red-500 text-center">{log}</p>

          </div>
          
            <div className="border-[1px] border-gray-400 my-5 mx-10">
            </div>
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="flex items-center w-full justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 mt-4 font-medium py-2 px-4 rounded-md shadow-sm transition"
            >
              {" "}
              <Image
                src={"/google-logo.svg"}
                width={25}
                height={50}
                alt="logo"
              />
              <h1>Sign in with Google</h1>
            </button>
            <div className="text-white text-center mt-4  mx-auto">Already have an account? <Link href={'/auth/login'}><button className="font-bold text-blue-700">Login</button></Link></div>
          </div>
        </form>
      </div>
      <div
        className={`col-span-1 bg-[url('/quote.jpg')] bg-no-repeat bg-center bg-cover`}
      ></div>
    </div>
  );
}
