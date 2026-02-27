import { Metadata } from "next";
import LoginForm from "@/components/forms/login-form";

export const metadata: Metadata = {
  title: "Login | Substitution Portal",
  description: "Login to your account",
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back
        </h1>
        <p className="text-sm text-gray-500">
          Enter your email to sign in to your account
        </p>
      </div>
      
      {/* We will build this component next */}
      <LoginForm /> 
    </div>
  );
}