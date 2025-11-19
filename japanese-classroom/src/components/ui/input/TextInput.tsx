"use client";

interface TextInputProps {
  type?: "text" | "email";
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  className?: string;
}

export default function TextInput({
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  className = "",
}: TextInputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className={`w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D4C4B0] focus:border-transparent text-[#5C4A37] placeholder:text-gray-400 ${className}`}
    />
  );
}

