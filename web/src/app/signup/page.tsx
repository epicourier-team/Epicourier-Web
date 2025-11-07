"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { validatePassword } from "@/lib/utils";
import { Utensils, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signup } from "./actions";

const SignUp = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const { toast } = useToast();
  const router = useRouter();

  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const validateForm = () => {
    const newErrors = { username: "", email: "", password: "", confirmPassword: "" };
    let firstError = "";

    // required checks
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
      if (!firstError) firstError = newErrors.username;
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      if (!firstError) firstError = newErrors.email;
    } else {
      // simple email format check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
        if (!firstError) firstError = newErrors.email;
      }
    }

    // password requirements
    if (!formData.password) {
      newErrors.password = "Password is required";
      if (!firstError) firstError = newErrors.password;
    } else {
      const pw = validatePassword(formData.password);
      if (!pw.isValid) {
        newErrors.password = pw.error;
        if (!firstError) firstError = newErrors.password;
      } else if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
        if (!firstError) firstError = newErrors.password;
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
      if (!firstError) firstError = newErrors.confirmPassword;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      if (!firstError) firstError = newErrors.confirmPassword;
    }

    setErrors(newErrors);
    return { isValid: !firstError, firstError };
  };

  const [serverError, setServerError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset any existing errors
    setErrors({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setServerError(null);

    const validation = validateForm();
    if (!validation.isValid) {
      // Don't show toast for client-side validations, just set the field errors
      return;
    }

    try {
      const result = await signup(formData);
      
      if (result?.error) {
        // Handle specific error cases
        const errorMessage = result.error.message;
        if (errorMessage.includes('email already exists')) {
          setErrors(prev => ({ ...prev, email: errorMessage }));
        } else if (errorMessage.includes('Password')) {
          setErrors(prev => ({ ...prev, password: errorMessage }));
        } else {
          // Show server errors in the red box
          setServerError(errorMessage);
        }
        return;
      }

      if (result?.success) {
        toast({
          title: "Success!",
          description: "Your account has been created. Please sign in.",
        });
        router.push("/signin");
      }
    } catch (err: unknown) {
      const errorMessage = "An unexpected error occurred. Please try again.";
      setServerError(errorMessage);
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
              <span className="text-2xl font-bold text-gray-900">EpiCourier</span>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Create Account</h1>
            <p className="text-gray-600">Start your smart meal journey today</p>
          </div>

          {serverError && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              <XCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
              <p className="font-medium">{serverError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="username" className="text-gray-700">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => {
                  setFormData({ ...formData, username: e.target.value });
                  if (errors.username) setErrors({ ...errors, username: "" });
                }}
                className={`mt-1.5 ${errors.username ? "border-red-500" : ""}`}
                placeholder="Choose a username"
              />
              {errors.username && <p className="mt-1 text-sm text-red-500">{errors.username}</p>}
            </div>

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
                }}
                className={`mt-1.5 ${errors.password ? "border-red-500" : ""}`}
                placeholder="Create a strong password"
              />
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-gray-700">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData({ ...formData, confirmPassword: e.target.value });
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
                }}
                className={`mt-1.5 ${errors.confirmPassword ? "border-red-500" : ""}`}
                placeholder="Re-enter your password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              className="h-11 w-full bg-emerald-600 text-base text-white hover:bg-emerald-700"
              onSubmit={handleSubmit}
            >
              Create Account
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link href="/signin" className="font-medium text-emerald-600 hover:text-emerald-700">
                Sign In
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

export default SignUp;
