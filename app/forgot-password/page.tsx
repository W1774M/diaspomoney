"use client";

import ForgotPasswordForm from "@/components/features/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 py-8">
      <div className="w-full max-w-md px-4">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
