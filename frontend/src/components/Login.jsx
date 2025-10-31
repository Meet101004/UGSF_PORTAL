import React, { useState } from "react";
import { loginApi } from "../api/auth";
import { setAuth } from "../store/authStore";
import { getDashboardPath } from "../routes/paths";

// Inline SVG icons
const LockIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="3" y="11" width="18" height="10" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const MailIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
const EyeIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOffIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-6 0-10-7-10-7a20.79 20.79 0 0 1 5.06-5.94" />
    <path d="M1 1l22 22" />
    <path d="M9.88 9.88A3 3 0 0 0 14.12 14.12" />
  </svg>
);
const GraduationCapIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);
const ShieldCheckIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);
const SparklesIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4M3 5h4M19 17v4M17 19h4" />
  </svg>
);

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email) return setError("Please enter your email");
    if (!password) return setError("Please enter your password");

    try {
      setLoading(true);
      const data = await loginApi({ email, password });

      setAuth({
        token: data.token,
        role: data.role,
        user: data.user,
        mustChangePassword: data.mustChangePassword,
      });

      if (data.mustChangePassword && (data.role === "hod" || data.role === "faculty")) {
        window.location.assign("/change-password");
        return;
      }
      window.location.assign(getDashboardPath(data.role));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Large banner */}
        <div className="lg:col-span-7">
          <div className="relative h-[78vh] min-h-[520px] rounded-[28px] overflow-hidden shadow-2xl">
            <img
              src="/leftside.png"
              alt="Institute banner"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Gradient + vignette for modern look */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-900/50 via-emerald-700/20 to-transparent" />
            <div className="absolute inset-0 bg-black/10" />
            {/* Subtle border glow */}
            <div className="pointer-events-none absolute inset-0 ring-1 ring-white/20" />
          </div>
        </div>

        {/* Right: Login card */}
        <div className="lg:col-span-5 flex items-center">
          <div className="w-full bg-white/80 backdrop-blur-xl rounded-[24px] border border-white/60 shadow-[0_20px_60px_rgba(0,0,0,0.15)] p-8 md:p-10">
            {/* Header with small image next to title */}
            <div className="flex items-center gap-3 mb-2">
              <img
                src="/charusat-banner.png"
                alt="Brand"
                className="h-10 w-10 rounded-lg object-cover shadow-md"
              />
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Sign in</h1>
            </div>
            <p className="text-gray-600 mb-6">Welcome back to your dashboard</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <div className="relative group">
                  <MailIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative group">
                  <LockIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    aria-label="toggle password visibility"
                  >
                    {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 font-medium">Remember me</span>
                </label>
                <a href="#" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                  Forgot password?
                </a>
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3.5 rounded-xl text-sm font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 px-4 rounded-xl font-bold text-lg hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 transition-all disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign In to Dashboard"}
              </button>

              <p className="text-center text-sm text-gray-600">
                New here?{" "}
                <a href="/register" className="text-emerald-700 hover:text-emerald-800 font-semibold">
                  Create Free Account
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
