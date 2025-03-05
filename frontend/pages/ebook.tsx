import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { Download, BookOpen, ArrowUp } from "lucide-react";

// Conteúdo de cada seção
const sectionsContent = {
  introducao: {
    title: "Introdução",
    content: "Bem-vindo ao seu guia de finanças pessoais! Aqui você aprenderá a controlar seus gastos, investir de forma inteligente e alcançar o equilíbrio entre sucesso financeiro e realização pessoal.",
  },
  "sabedoria-financeira": {
    title: "Sabedoria Financeira Milenar",
    content: "Aprenda com os princípios bíblicos que têm guiado gerações em busca de uma vida próspera e equilibrada.",
  },
  "construindo-riqueza": {
    title: "Construindo Riqueza com Propósito",
    content: "Descubra como alinhar seus recursos com um propósito maior e impactar positivamente o mundo ao seu redor.",
  },
  "investimento-inteligente": {
    title: "O Poder do Investimento Inteligente",
    content: "Aprenda a investir de forma segura e estratégica, multiplicando seus recursos com sabedoria.",
  },
  "planejamento-financeiro": {
    title: "Planejamento Financeiro",
    content: "Transforme seus sonhos em metas e suas metas em realidade com um planejamento financeiro eficaz.",
  },
  "multiplicando-recursos": {
    title: "Multiplicando Seus Recursos com Sabedoria",
    content: "Aprenda a multiplicar seus recursos financeiros, intelectuais e espirituais para alcançar uma colheita abundante.",
  },
  "disciplina-planejamento": {
    title: "O Poder da Disciplina e do Planejamento",
    content: "Descubra como a disciplina e o planejamento podem transformar sua vida financeira e pessoal.",
  },
  "proposito-prosperidade": {
    title: "O Propósito da Prosperidade",
    content: "Entenda que a verdadeira prosperidade vai além dos bens materiais e está alinhada ao propósito divino.",
  },
};

const EbookPage = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeSection, setActiveSection] = useState("introducao");
  const [highlights, setHighlights] = useState([]);
  const [textColor, setTextColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(16);
  const [isClient, setIsClient] = useState(false); // Verifica se está no cliente

  // Estado para controlar o sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Verifica se está no navegador
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Carrega dados do localStorage apenas no cliente
  useEffect(() => {
    if (isClient) {
      const savedSection = localStorage.getItem("lastReadSection");
      if (savedSection) setActiveSection(savedSection);

      const savedHighlights = localStorage.getItem("highlights");
      if (savedHighlights) setHighlights(JSON.parse(savedHighlights));
    }
  }, [isClient]);

  // Salva a seção atual no localStorage sempre que ela mudar
  useEffect(() => {
    if (isClient) {
      localStorage.setItem("lastReadSection", activeSection);
    }
  }, [activeSection, isClient]);

  // Salva os destaques no localStorage sempre que eles mudarem
  useEffect(() => {
    if (isClient) {
      localStorage.setItem("highlights", JSON.stringify(highlights));
    }
  }, [highlights, isClient]);

  const handleDownload = () => {
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      window.open("/livro.pdf", "_blank");
    }, 2000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleHighlight = () => {
    const selection = window.getSelection();
    if (selection.toString().trim()) {
      const newHighlight = {
        text: selection.toString(),
        section: activeSection,
      };
      setHighlights([...highlights, newHighlight]);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <Header toggleSidebar={toggleSidebar} />

        {/* Conteúdo da página */}
        <div className="p-6">
          {/* Capa do E-book */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center">
            <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Rumo à Prosperidade
            </h1>
            <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg">
              Descubra os princípios que transformam sua vida financeira, emocional e espiritual.
            </p>
            <img
              src="/rumo.pdf.png"
              alt="Capa do E-book"
              className="w-64 h-auto mx-auto mb-6 rounded-lg shadow-lg"
            />
            {/* Botão de Download (Opcional) */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition flex items-center justify-center mx-auto"
            >
              {isDownloading ? (
                "Baixando..."
              ) : (
                <>
                  <Download size={20} className="mr-2" />
                  Baixar E-book
                </>
              )}
            </button>
          </div>

          {/* Índice do E-book */}
          <div className="mt-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              Índice
            </h2>
            <ul className="space-y-3">
              {Object.keys(sectionsContent).map((sectionId) => (
                <li key={sectionId}>
                  <button
                    onClick={() => setActiveSection(sectionId)}
                    className={`text-left w-full px-4 py-3 rounded-lg transition-all ${
                      activeSection === sectionId
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    <span className="flex items-center">
                      <BookOpen size={16} className="mr-2" />
                      {sectionsContent[sectionId].title}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Conteúdo do E-book */}
          <div className="mt-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
            <div className="mb-4">
              <button
                onClick={handleHighlight}
                className="bg-yellow-500 text-white px-4 py-2 rounded"
              >
                Destacar Texto Selecionado
              </button>
            </div>
            <div style={{ color: textColor, fontSize: `${fontSize}px` }}>
              <h2 className="text-2xl font-bold mb-4">
                {sectionsContent[activeSection].title}
              </h2>
              <p>{sectionsContent[activeSection].content}</p>
            </div>
          </div>

            {/* Trechos Destacados */}
            <div className="mt-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Trechos Destacados</h2>
            <ul className="space-y-2">
              {highlights
              .filter((highlight) => highlight.section === activeSection)
              .map((highlight, index) => (
                <li key={index} className="bg-yellow-100 dark:bg-yellow-600 p-2 rounded text-gray-900 dark:text-gray-100">
                {highlight.text}
                </li>
              ))}
            </ul>
            </div>

          {/* Personalização */}
          <div className="mt-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Personalização</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Cor do Texto</label>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Tamanho da Fonte</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setFontSize(fontSize + 1)}
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                  >
                    A+
                  </button>
                  <button
                    onClick={() => setFontSize(fontSize - 1)}
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                  >
                    A-
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Botão para voltar ao topo */}
          <button
            onClick={scrollToTop}
            className="fixed bottom-4 right-4 p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition"
          >
            <ArrowUp size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EbookPage;