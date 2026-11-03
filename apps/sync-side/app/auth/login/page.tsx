"use client";
import React, { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";

const LoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof LoginSchema>;

function LoginForm() {
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
  const searchParams = useSearchParams();

  // Where to land after login (e.g. a meeting link the user was invited to).
  // Only same-origin relative paths are honored.
  const rawCallback = searchParams.get("callbackUrl");
  const callbackUrl =
    rawCallback && rawCallback.startsWith("/") && !rawCallback.startsWith("//")
      ? rawCallback
      : "/dashboard";

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setLog("");

    try {
      const res = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (res?.ok) {
        reset();
        router.push(callbackUrl);
      } else {
        if (res?.error === "CredentialsSignin") {
          setLog("Invalid email or password");
        } else {
          setLog("Something went wrong. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error during login:", error);
      setLog("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen w-full grid-cols-1 bg-[#08090A] text-[#F7F8F8] antialiased md:grid-cols-2">
      <div className="lobby-grid-wrap relative col-span-1 flex w-full items-center justify-center overflow-hidden px-5 py-10">
        <div className="lobby-grid pointer-events-none absolute inset-0 opacity-60" />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(94,106,210,0.16), transparent 80%)",
          }}
        />
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="lobby-rise relative z-10 w-full max-w-sm"
        >
          <div className="mb-8 flex flex-col items-center gap-3">
            <Image src={"/logo.svg"} width={200} height={80} alt="logo" className="h-9 w-auto" />
            <h1 className="text-[15px] text-[#8A8F98]">Welcome back</h1>
          </div>

          <div className="flex w-full flex-col gap-4">
            {/* Email */}
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[#D0D3D9]">Email</label>
              <input
                disabled={loading}
                autoFocus
                autoComplete="email"
                {...register("email")}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-[14px] text-[#F7F8F8] placeholder:text-[#5C616B] outline-none transition-colors focus:border-[#5E6AD2] disabled:opacity-50"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-[12px] text-[#EB5757]">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-[#D0D3D9]">Password</label>
              <input
                disabled={loading}
                type="password"
                autoComplete="current-password"
                {...register("password")}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-[14px] text-[#F7F8F8] placeholder:text-[#5C616B] outline-none transition-colors focus:border-[#5E6AD2] disabled:opacity-50"
                placeholder="Enter password"
              />
              {errors.password && (
                <p className="mt-1 text-[12px] text-[#EB5757]">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex h-11 w-full items-center justify-center rounded-xl bg-[#5E6AD2] text-[14px] font-medium text-white transition-colors hover:bg-[#6E79D6] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Logging in…" : "Login"}
            </button>
            <p role="alert" className="h-5 text-center text-[12px] text-[#EB5757]">
              {log}
            </p>
          </div>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/[0.08]" />
            <span className="text-[12px] text-[#5C616B]">or</span>
            <div className="h-px flex-1 bg-white/[0.08]" />
          </div>

          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl })}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-[14px] font-medium text-[#D0D3D9] transition-colors hover:bg-white/[0.05]"
          >
            <Image src={"/Google-logo.svg"} width={20} height={20} alt="Google" />
            Sign in with Google
          </button>

          <div className="mt-8 text-center text-[13px] text-[#8A8F98]">
            Don&apos;t have an account?{" "}
            <Link
              href={`/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="font-medium text-[#8C93E8] transition-colors hover:text-[#A6ABEE]"
            >
              Sign up
            </Link>
          </div>
        </form>
      </div>
      <div className="relative col-span-1 hidden bg-[url('/quote.jpg')] bg-cover bg-center bg-no-repeat md:block">
        <div className="absolute inset-0 bg-gradient-to-t from-[#08090A] via-transparent to-transparent opacity-70" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}