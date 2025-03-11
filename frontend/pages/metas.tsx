import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MetaForm from "../components/MetaForm";
import { FaPlus } from "react-icons/fa";
import { useFinance } from "../context/FinanceContext";
import { Meta as MetaType } from "../src/types/Meta"; // Importe a interface Meta

// Ensure MetaType interface includes title and description properties
interface LocalMeta {
  _id: string;
  title: string;
  description: string;
  // ...other properties...
}

export default function Metas() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [metaEditavel, setMetaEditavel] = useState<LocalMeta | null>(null); // metaEditavel pode ser LocalMeta ou null
  const [metas, setMetas] = useState<LocalMeta[]>([]); // Estado para armazenar as metas
  const { addMeta, editMeta, loading, getMetas } = useFinance(); // Adicione getMetas ao contexto

  useEffect(() => {
    async function fetchMetas() {
      const fetchedMetas = await getMetas();
      if (Array.isArray(fetchedMetas)) {
        setMetas(fetchedMetas);
      } else {
        setMetas([]);
      }
    }
    fetchMetas();
  }, [getMetas]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <ToastContainer position="top-right" autoClose={3000} />
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <Header toggleSidebar={toggleSidebar} />

        {/* Conteúdo da página */}
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Metas
          </h1>

          {/* Lista de Metas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metas.map((meta) => (
              <div key={meta._id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{meta.title}</h2>
                <p className="text-gray-700 dark:text-gray-300">{meta.description}</p>
                <button
                  onClick={() => {
                    setMetaEditavel(meta);
                    setIsFormOpen(true);
                  }}
                  className="mt-4 p-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600 transition"
                >
                  Editar
                </button>
              </div>
            ))}
          </div>

          {/* Botão para Adicionar Meta */}
          <button
            onClick={() => {
              setMetaEditavel(null);
              setIsFormOpen(true);
            }}
            className="fixed bottom-6 right-6 p-4 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition"
          >
            <FaPlus size={24} />
          </button>
        </div>
      </div>

      {/* Modal de Adicionar/Editar Meta */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
              {metaEditavel ? "Editar Meta" : "Adicionar Meta"}
            </h2>
            <MetaForm
              onClose={() => {
                setIsFormOpen(false);
                setMetaEditavel(null);
              }}
              onSaveMeta={
                metaEditavel && metaEditavel._id
                  ? (meta) => editMeta(metaEditavel._id!, meta) // Usando "!" para afirmar que _id não é undefined
                  : addMeta
              }
              metaEditavel={metaEditavel || undefined} // Converte null para undefined
              isLoading={loading}
            />
          </div>
        </div>
      )}
    </div>
  );
}