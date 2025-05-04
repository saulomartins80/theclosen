import { signIn } from "next-auth/react";
import { FaGoogle } from "react-icons/fa";

export default function GoogleLoginButton() {
  const handleLogin = async () => {
    try {
      await signIn("google", {
        callbackUrl: process.env.NEXT_PUBLIC_AUTH_CALLBACK_URL || "/dashboard"
      });
    } catch (error) {
      console.error("Erro ao fazer login com Google:", error);
    }
  };

  return (
    <button
      onClick={handleLogin}
      className="flex items-center justify-center gap-2 bg-white text-gray-800 font-medium py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
    >
      <FaGoogle className="text-red-500" />
      Continuar com Google
    </button>
  );
}