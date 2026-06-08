import type { Metadata } from "next";
import SignupForm from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Create Account — Learnify",
  description: "Join Learnify and start learning today.",
};

export default function SignupPage() {
  return <SignupForm />;
}
