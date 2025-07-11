import { RegisterForm } from "@/components/features/auth/RegisterForm";
import DefaultTemplate from "@/template/DefaultTemplate";

export default function RegisterPage() {
  return (
    <DefaultTemplate>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 py-8">
        <RegisterForm />
      </div>
    </DefaultTemplate>
  );
}
