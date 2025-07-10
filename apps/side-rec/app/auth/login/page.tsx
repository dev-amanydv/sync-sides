"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";

const LoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof LoginSchema>;

export default function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
  });
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState("");
  const router = useRouter();

  const onSubmit = async (data: LoginFormData) => {
    console.log("=== LOGIN FORM SUBMITTED ===");
    console.log("Form data:", data);
    setLoading(true);
    try {
      console.log("Calling signIn...");
      const res = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      console.log("signIn response:", res);

      if (res?.ok) {
        console.log("Login successful, redirecting to dashboard");
        reset();
        router.push("/dashboard");
      } else {
        console.log("Login failed:", res?.error);
        if (res?.error === "CredentialsSignin") {
          setLog("Invalid email or password");
        } else {
          setLog("Something went wrong. Try again.");
        }
      }
    } catch (error) {
      console.error("Error during login:", error);
    } finally {
      setLoading(false);
    }
  };

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
          className="max-w-lg w-full flex justify-center gap-20 items-center flex-col   mx-auto relative  px-5 py-5 rounded-2xl shadow space-y-4"
        >
          <div>
          <div className="flex flex-col justify-center gap-2 items-center">
            <h1 className="text-xl text-gray-300">Welcome Back!</h1>
            <Image src={"/logo.svg"} width={400} height={200} alt="logo" />
          </div>
          <div className="w-full max-w-lg flex flex-col gap-5">
            {/* Email */}
            <div>
              <label className="block text-sm text-gray-300 font-medium">
                Email
              </label>
              <input
                disabled={loading}
                autoFocus
                required
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
                required
                disabled={loading}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full font-medium mt-5 bg-white text-black py-2 rounded hover:bg-gray-400 transition"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
            <p role="alert" className="text-red-500 text-center">
              {log}
            </p>

          </div>
          

            <div className="border-[1px] border-gray-400 my-5 mx-10"></div>
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="flex items-center w-full justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 font-medium py-2 px-4 rounded-md shadow-sm transition"
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
            <div className="text-white text-center mt-10 mx-auto">
              Don't have an account?{" "}
              <Link href={"/auth/signup"}>
                <button className="font-bold text-blue-700">Signup</button>
              </Link>
            </div>
          </div>
        </form>
      </div>
      <div
        className={`col-span-1 bg-[url('/quote.jpg')] bg-no-repeat bg-center bg-cover`}
      ></div>
    </div>
  );
}
