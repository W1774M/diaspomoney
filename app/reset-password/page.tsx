"use client";
import { ResetPasswordForm } from "@/components/features/auth/ResetPasswordForm";
import DefaultTemplate from "@/template/DefaultTemplate";

export default function ResetPasswordPage() {
  return (
    <DefaultTemplate>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 py-8">
        <ResetPasswordForm />
      </div>
    </DefaultTemplate>
  );
}
