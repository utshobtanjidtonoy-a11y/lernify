import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "sm" | "md" | "lg";
}

export default function Card({
  children,
  className = "",
  hover = false,
  padding = "md",
}: CardProps) {
  const paddings = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={`bg-white border border-slate-100 rounded-2xl ${paddings[padding]} ${
        hover
          ? "hover:shadow-xl hover:shadow-blue-50/80 hover:-translate-y-1 transition-all duration-300"
          : "shadow-sm"
      } ${className}`}
    >
      {children}
    </div>
  );
}
