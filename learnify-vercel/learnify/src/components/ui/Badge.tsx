import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "blue" | "green" | "orange" | "purple";
  className?: string;
}

export default function Badge({
  children,
  variant = "blue",
  className = "",
}: BadgeProps) {
  const variants = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-green-50 text-green-700 border-green-100",
    orange: "bg-orange-50 text-orange-700 border-orange-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
  };

  return (
    <span
      className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-lg border ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
