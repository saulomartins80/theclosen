import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function Configuracoes() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Define o estado inicial do Sidebar (fechado no mobile, aberto no desktop)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // 768px é o breakpoint para desktop (md)
        setIsSidebarOpen(true); // Abre o Sidebar no desktop
      } else {
        setIsSidebarOpen(false); // Fecha o Sidebar no mobile
      }
    };

    // Verifica o tamanho da tela ao carregar a página
    handleResize();

    // Atualiza o estado ao redimensionar a tela
    window.addEventListener("resize", handleResize);

    // Remove o listener ao desmontar o componente
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header toggleSidebar={toggleSidebar} />

        {/* Conteúdo da página */}
        <div className="p-6">
          <h1 className="text-2xl font-bold">Configurações</h1>
          {/* Adicione conteúdo específico da página de configurações aqui */}
        </div>
      </div>
    </div>
  );
}