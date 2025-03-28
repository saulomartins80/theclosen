import { useState, useEffect } from "react";
import { Moon, Sun, ArrowUp, ArrowDown, Bell, Type } from "lucide-react";
import { api } from "../services/api";

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState({
    theme: "system",
    order: "asc",
    alertsEnabled: true,
    systemFontEnabled: false,
  });

  // Carrega as configurações do backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get("/api/settings");
        setSettings(response.data);
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      }
    };

    fetchSettings();
  }, []);

  // Salva as configurações no backend
  const saveSettings = async () => {
    try {
      await api.post("/api/settings", settings);
      console.log("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
    }
  };

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Configurações</h1>

      {/* Seção: Visual do Aplicativo */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Visual do Aplicativo</h2>
        <div className="space-y-4">
          <div
            className={`flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg cursor-pointer ${
              settings.theme === "system" ? "border-2 border-blue-500" : "border border-gray-200 dark:border-gray-700"
            }`}
            onClick={() => setSettings({ ...settings, theme: "system" })}
          >
            <Moon size={20} className="text-gray-900 dark:text-white" />
            <span className="text-gray-900 dark:text-white">Usar do sistema</span>
          </div>
          <div
            className={`flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg cursor-pointer ${
              settings.theme === "dark" ? "border-2 border-blue-500" : "border border-gray-200 dark:border-gray-700"
            }`}
            onClick={() => setSettings({ ...settings, theme: "dark" })}
          >
            <Moon size={20} className="text-gray-900 dark:text-white" />
            <span className="text-gray-900 dark:text-white">Modo escuro</span>
          </div>
          <div
            className={`flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg cursor-pointer ${
              settings.theme === "light" ? "border-2 border-blue-500" : "border border-gray-200 dark:border-gray-700"
            }`}
            onClick={() => setSettings({ ...settings, theme: "light" })}
          >
            <Sun size={20} className="text-gray-900 dark:text-white" />
            <span className="text-gray-900 dark:text-white">Modo claro</span>
          </div>
        </div>
      </div>

      {/* Seção: Ordem dos Lançamentos */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Ordem dos Lançamentos</h2>
        <div className="space-y-4">
          <div
            className={`flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg cursor-pointer ${
              settings.order === "asc" ? "border-2 border-blue-500" : "border border-gray-200 dark:border-gray-700"
            }`}
            onClick={() => setSettings({ ...settings, order: "asc" })}
          >
            <ArrowUp size={20} className="text-gray-900 dark:text-white" />
            <span className="text-gray-900 dark:text-white">Crescente</span>
          </div>
          <div
            className={`flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg cursor-pointer ${
              settings.order === "desc" ? "border-2 border-blue-500" : "border border-gray-200 dark:border-gray-700"
            }`}
            onClick={() => setSettings({ ...settings, order: "desc" })}
          >
            <ArrowDown size={20} className="text-gray-900 dark:text-white" />
            <span className="text-gray-900 dark:text-white">Decrescente</span>
          </div>
        </div>
      </div>

      {/* Seção: Alertas e Notificações */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Alertas e Notificações</h2>
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-3">
            <Bell size={20} className="text-gray-900 dark:text-white" />
            <span className="text-gray-900 dark:text-white">Ativar alerta</span>
          </div>
          <input
            type="checkbox"
            checked={settings.alertsEnabled}
            onChange={() => setSettings({ ...settings, alertsEnabled: !settings.alertsEnabled })}
            className="toggle-checkbox"
          />
        </div>
      </div>

      {/* Seção: Acessibilidade */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Acessibilidade</h2>
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg">
          <div className="flex items-center space-x-3">
            <Type size={20} className="text-gray-900 dark:text-white" />
            <span className="text-gray-900 dark:text-white">Ativar fonte do sistema</span>
          </div>
          <input
            type="checkbox"
            checked={settings.systemFontEnabled}
            onChange={() => setSettings({ ...settings, systemFontEnabled: !settings.systemFontEnabled })}
            className="toggle-checkbox"
          />
        </div>
      </div>

      {/* Botão para salvar configurações */}
      <button
        onClick={saveSettings}
        className="mt-6 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
      >
        Salvar Configurações
      </button>
    </div>
  );
}