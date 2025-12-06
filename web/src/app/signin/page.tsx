"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Utensils, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { login } from "./actions";

const SignIn = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState({ email: "", password: "" });

  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset all errors
    setError(null);
    setErrors({ email: "", password: "" });

    // Client-side validation
    const validationErrors: { email?: string; password?: string } = {};

    if (!formData.email.trim()) {
      validationErrors.email = "Email is required";
    } else {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        validationErrors.email = "Please enter a valid email address";
      }
    }

    if (!formData.password.trim()) {
      validationErrors.password = "Password is required";
    }

    // If there are validation errors, show them and return
    if (Object.keys(validationErrors).length > 0) {
      setErrors({
        email: validationErrors.email || "",
        password: validationErrors.password || "",
      });
      // Don't set the error state or show toast for client-side validations
      return;
    }

    try {
      const result = await login(formData);

      if (result?.error) {
        // Handle specific Supabase error messages
        let errorMessage = result.error;
        if (result.error.includes("Invalid login credentials")) {
          errorMessage = "Incorrect email or password";
        }
        setError(errorMessage);
        toast({
          title: "Sign in failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      // If we get here, sign in was successful
      toast({
        title: "Success",
        description: "Welcome back!",
      });
    } catch {
      const errorMessage = "An unexpected error occurred. Please try again.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-orange-50 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <div className="flex items-center gap-2">
              <Utensils className="h-8 w-8 text-emerald-600" />
              <span className="text-2xl font-bold text-gray-900">Epicourier</span>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-gray-600">Sign in to continue your meal journey</p>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 transition-opacity duration-300">
              <XCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="email" className="text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="text"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: "" });
                  if (error) setError(null);
                }}
                className={`mt-1.5 ${errors.email ? "border-red-500" : ""}`}
                placeholder="your@email.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-700">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (errors.password) setErrors({ ...errors, password: "" });
                  if (error) setError(null);
                }}
                className={`mt-1.5 ${errors.password ? "border-red-500" : ""}`}
                placeholder="Enter your password"
              />
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
            </div>

            {/* <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" className="rounded border-gray-300" />
                Remember me
              </label>
              <a href="#" className="text-sm text-emerald-600 hover:text-emerald-700">
                Forgot password?
              </a>
            </div> */}

            <Button
              type="submit"
              className="h-11 w-full bg-emerald-600 text-base text-white hover:bg-emerald-700"
            >
              Sign In
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don{"'"}t have an account?{" "}
              <Link href="/signup" className="font-medium text-emerald-600 hover:text-emerald-700">
                Sign Up
              </Link>
            </p>
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
