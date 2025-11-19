"use client";

import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { TextInput, PasswordInput } from "./input";

interface SignUpFormProps {
  onSwitchToLogin: () => void;
  onClose: () => void;
}

export default function SignUpForm({
  onSwitchToLogin,
  onClose,
}: SignUpFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setIsLoading(true);

    try {
      await register(email, password, displayName);
      onClose();
    } catch (err) {
      const error = err as { message?: string };
      setError(error.message || "Đăng ký thất bại. Vui lòng thử lại sau.");
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
      <h2 className="text-2xl font-bold text-[#5C4A37] mb-2">Create account</h2>
      <p className="text-sm text-[#8B7355] mb-8">Join your peaceful space</p>

      {/* Error message */}
      {error && (
        <div className="w-full mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full space-y-4">
        {/* Display name field */}
        <TextInput
          type="text"
          placeholder="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />

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

        {/* Confirm Password field */}
        <PasswordInput
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {/* Sign up button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-lg bg-[#D4C4B0] text-[#5C4A37] font-medium hover:bg-[#C9B8A3] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Đang đăng ký..." : "Sign up"}
        </button>
      </form>

      {/* Sign in link */}
      <div className="mt-6 text-sm text-[#5C4A37]">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-[#8B7355] hover:text-[#5C4A37] font-medium transition-colors"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}
