import { useRouter } from "next/router";

const Login = () => {
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: "seu@email.com", password: "suaSenha" }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log("Usuário logado:", data.user);
        router.push("/dashboard"); // Redireciona para o dashboard
      } else {
        console.error("Erro ao fazer login:", data.error);
      }
    } catch (error) {
      console.error("Erro ao conectar com o servidor:", error);
    }
  };

  return (
    <div>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default Login;