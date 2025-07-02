import { useAuth } from "../context/AuthContext";
import { FaGoogle } from "react-icons/fa";

export default function GoogleLoginButton() {
  const { loginWithGoogle, loading, error } = useAuth();

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Erro ao fazer login com Google:", error);
    }
  };

  return (
    <div>
      <button
        onClick={handleLogin}
        disabled={loading}
        className="flex items-center justify-center gap-2 bg-white text-gray-800 font-medium py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FaGoogle className="text-red-500" />
        {loading ? "Carregando..." : "Continuar com Google"}
      </button>
      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
    </div>
  );
}