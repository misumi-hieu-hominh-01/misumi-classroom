"use client";

import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { TextInput, PasswordInput } from "./input";

interface LoginFormProps {
  onSwitchToSignUp: () => void;
  onClose: () => void;
}

export default function LoginForm({
  onSwitchToSignUp,
  onClose,
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      onClose();
    } catch (err) {
      const error = err as { message?: string };
      setError(
        error.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center">
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-[#F5F0E8] flex items-center justify-center mb-6">
        <span className="text-3xl">😊</span>
      </div>

      {/* Heading */}
      <h2 className="text-2xl font-bold text-[#5C4A37] mb-2">Welcome back</h2>
      <p className="text-sm text-[#8B7355] mb-8">
        Sign in to your peaceful space
      </p>

      {/* Error message */}
      {error && (
        <div className="w-full mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full space-y-4">
        {/* Email field */}
        <TextInput
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {/* Password field */}
        <PasswordInput
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {/* Remember me and Forgot password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#D4C4B0] focus:ring-[#D4C4B0] cursor-pointer"
            />
            <span className="text-sm text-[#5C4A37]">Remember me</span>
          </label>
          <button
            type="button"
            className="text-sm text-[#8B7355] hover:text-[#5C4A37] transition-colors"
          >
            Forgot password?
          </button>
        </div>

        {/* Sign in button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-lg bg-[#D4C4B0] text-[#5C4A37] font-medium hover:bg-[#C9B8A3] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Đang đăng nhập..." : "Sign in"}
        </button>
      </form>

      {/* Sign up link */}
      <div className="mt-6 text-sm text-[#5C4A37]">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToSignUp}
          className="text-[#8B7355] hover:text-[#5C4A37] font-medium transition-colors"
        >
          Sign up
        </button>
      </div>
    </div>
  );
}
