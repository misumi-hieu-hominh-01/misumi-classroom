"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";

interface SafeImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
}

/**
 * SafeImage component that handles both internal and external images
 * Falls back to regular img tag for external images to avoid Next.js hostname restrictions
 */
export function SafeImage({
  src,
  alt,
  fill,
  width,
  height,
  className = "",
  objectFit = "cover",
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if image is external (starts with http:// or https://)
  const isExternal = src.startsWith("http://") || src.startsWith("https://");

  // If error occurred, show placeholder
  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
      >
        <div className="text-center text-gray-400">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-xs">Image not available</p>
        </div>
      </div>
    );
  }

  // For external images, use regular img tag to avoid Next.js restrictions
  if (isExternal) {
    return (
      <div className={`relative ${fill ? "w-full h-full" : ""} ${className}`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          className={`${fill ? "w-full h-full" : ""} ${
            objectFit === "cover"
              ? "object-cover"
              : objectFit === "contain"
              ? "object-contain"
              : ""
          } ${
            isLoading ? "opacity-0" : "opacity-100"
          } transition-opacity ${className}`}
          style={fill ? { objectFit } : undefined}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
          onLoad={() => setIsLoading(false)}
          loading="lazy"
        />
      </div>
    );
  }

  // For internal images, use Next.js Image component
  if (fill) {
    return (
      <div className={`relative ${className}`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}
        <Image
          src={src}
          alt={alt}
          fill
          className={`${
            objectFit === "cover"
              ? "object-cover"
              : objectFit === "contain"
              ? "object-contain"
              : ""
          } ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity`}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
          onLoad={() => setIsLoading(false)}
        />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`${
          objectFit === "cover"
            ? "object-cover"
            : objectFit === "contain"
            ? "object-contain"
            : ""
        } ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity`}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
}
