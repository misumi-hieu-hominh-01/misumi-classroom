"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  const router = useRouter();

  return (
    <nav className="mb-6" aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isClickable = item.href && !isLast;

          return (
            <li key={index} className="flex items-center gap-2">
              {index === 0 && <Home size={16} className="text-gray-500" />}
              {isClickable ? (
                <button
                  onClick={() => router.push(item.href!)}
                  className="text-gray-600 hover:text-[#5C4A37] transition-colors font-medium cursor-pointer"
                >
                  {item.label}
                </button>
              ) : (
                <span
                  className={
                    isLast ? "text-[#5C4A37] font-semibold" : "text-gray-600"
                  }
                >
                  {item.label}
                </span>
              )}
              {!isLast && <ChevronRight size={16} className="text-gray-400" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
