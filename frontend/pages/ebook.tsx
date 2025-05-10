import { useState, useEffect, useRef } from "react";
import { Download, BookOpen, ArrowUp, Bookmark, Search, BookText } from "lucide-react";
import Image from 'next/image';

interface SectionContent {
  id: string;
  titulo: string;
  conteudo: string[];
  slug: string;
  ordem: number;
  liberado: boolean;
  dataPublicacao: Date;
}

interface Highlight {
  id: string;
  text: string;
  section: string;
  createdAt: Date;
}

// CONTEÚDO COMPLETO DO LIVRO (ATUALIZADO)
const BOOK_CONTENT: { [key: string]: SectionContent } = {
  introducao: {
    id: "intro",
    titulo: "Introdução",
    conteudo: [
      "Vivemos em um mundo de incertezas, onde o equilíbrio entre o sucesso financeiro e a realização pessoal parece cada vez mais desafiador.",
      "Este livro não é apenas sobre ganhar dinheiro; ele é um guia para encontrar significado na sua jornada. Inspirado nos ensinamentos bíblicos, em princípios eternos e em estratégias práticas, este livro ajudará você a alcançar a prosperidade verdadeira.",
      "Se você está cansado de correr atrás de metas vazias ou se sente preso em sua situação atual, saiba que há um caminho de transformação. Este livro é para você."
    ],
    slug: "introducao",
    ordem: 0,
    liberado: true,
    dataPublicacao: new Date("2025-01-01")
  },
  capitulo1: {
    id: "cap1",
    titulo: "Capítulo 1: O que é prosperidade verdadeira?",
    conteudo: [
      "Quando falamos de prosperidade, qual é a primeira imagem que vem à sua mente? Dinheiro, bens materiais ou talvez uma vida de luxo? Mas a prosperidade vai muito além disso.",
      "Neste capítulo, você será convidado a repensar o que significa ser verdadeiramente próspero. Vamos embarcar em uma jornada que não apenas te ensinará como administrar seus recursos, mas também como transformar sua visão sobre riqueza.",
      "Imagine uma vida onde você não só conquista, mas também desfruta. Onde cada decisão financeira é um passo em direção à sua realização pessoal e espiritual. Não se trata apenas de ter mais, mas de ser mais.",
      "Salomão disse: 'Com sabedoria se constrói a casa, e com discernimento ela se consolida; pelo conhecimento, seus cômodos se enchem do que é precioso e agradável.' (Provérbios 24:3-4)",
      "A prosperidade começa dentro de você. Você está pronto para dar os primeiros passos rumo à transformação?"
    ],
    slug: "capitulo-1",
    ordem: 1,
    liberado: true,
    dataPublicacao: new Date("2025-01-02")
  },
  capitulo2: {
    id: "cap2",
    titulo: "Capítulo 2: Sabedoria Financeira Milenar",
    conteudo: [
      "Os ensinamentos bíblicos têm guiado gerações em busca de vida próspera. No centro está Salomão, cuja sabedoria ainda ilumina questões financeiras.",
      "PLANEJAMENTO CUIDADOSO:",
      "Exemplo: Quem organiza um orçamento mensal pode economizar para emergências e alcançar metas como comprar uma casa ou investir em educação.",
      "Desafio: Crie um plano financeiro para os próximos 6 meses. Liste metas, despesas fixas e quanto poupar.",
      "TRABALHO DILIGENTE:",
      "'Quem trabalha com dedicação terá fartura; quem age com pressa acaba na pobreza' (Provérbios 28:19).",
      "José no Egito administrou recursos do faraó durante anos de abundância e escassez (Gênesis 41).",
      "Dica: Identifique suas habilidades e dedique-se a um trabalho que traga realização."
    ],
    slug: "capitulo-2",
    ordem: 2,
    liberado: true,
    dataPublicacao: new Date("2025-01-03")
  },
  capitulo3: {
    id: "cap3",
    titulo: "Capítulo 3: O princípio da semeadura",
    conteudo: [
        "Você já parou para pensar por que deseja prosperar? Será que a busca por riqueza é apenas para satisfazer desejos pessoais, ou há algo maior em jogo? Este capítulo não é apenas um guia financeiro, mas um convite para que você olhe para dentro de si e descubra o verdadeiro propósito por trás de seus recursos.",
        "1. A Prosperidade Começa no Coração",
        "Pense na história do jovem rico (Mateus 19:16-22). Ele tinha tudo, mas não conseguiu abrir mão de suas posses para seguir Jesus. O que você não está disposto a abrir mão?",
        "2. Quebrando o Ciclo da Avareza",
        "'Não se preocupem com o que vão comer ou vestir. O Pai celestial sabe do que vocês precisam' (Mateus 6:31-32).",
        "3. O Poder da Multiplicação com Propósito",
        "'Deem, e será dado a vocês: uma boa medida, calcada, sacudida e transbordante' (Lucas 6:38).",
        "4. Como Seus Recursos Podem Impactar o Mundo",
        "Reserve 10% da sua renda para generosidade. Pode ser para ajudar alguém em necessidade, investir em sua comunidade ou apoiar sua igreja.",
        "5. Construindo um Legado que Fala por Si",
        "Quando sua vida acabar, o que as pessoas lembrarão sobre você?",
        "A prosperidade que transforma não vem de fora, mas de dentro. Quando mudamos nossa visão, alinhamos nossos desejos com os de Deus e passamos a viver com propósito, nossos recursos se tornam bênçãos que impactam gerações."
      ],
    slug: "capitulo-3",
    ordem: 3,
    liberado: true,
    dataPublicacao: new Date("2025-01-04")
  },
  capitulo4: {
    id: "cap4",
    titulo: "Capítulo 4: Controlando suas emoções",
    conteudo: [
        "As emoções podem ser nossas maiores aliadas ou nossas piores inimigas quando se trata de finanças. Quantas vezes você já tomou uma decisão financeira movido pelo impulso do momento e se arrependeu depois?",
        "O Controle Emocional nas Finanças",
        "1. Reconheça seus gatilhos emocionais: O que te leva a gastar por impulso? Estresse? Ansiedade?",
        "2. Crie um intervalo entre o desejo e a compra: Espere 24 horas antes de fazer compras não planejadas.",
        "3. Desenvolva uma mentalidade de abundância: Acredite que há o suficiente para todos, incluindo você.",
        "A Sabedoria de Salomão:",
        "'Melhor é o paciente do que o guerreiro, mais vale controlar o seu espírito do que conquistar uma cidade.' (Provérbios 16:32)",
        "Exercício Prático:",
        "Na próxima vez que sentir uma forte emoção em relação a dinheiro (medo, ganância, ansiedade), pare e respire fundo. Anote o que está sentindo e por quê. Depois de 10 minutos, reavalie se a decisão que estava prestes a tomar ainda faz sentido."
      ],
    slug: "capitulo-4",
    ordem: 4,
    liberado: true,
    dataPublicacao: new Date("2025-01-05")
  },
  capitulo5: {
    id: "cap5",
    titulo: "Capítulo 5: Disciplina: a chave para o sucesso",
    conteudo: [
        "A disciplina é a ponte entre metas e realizações. Sem ela, mesmo os melhores planos financeiros ficam apenas no papel.",
        "Princípios da Disciplina Financeira:",
        "1. Automatize suas finanças: Configure transferências automáticas para poupança e investimentos.",
        "2. Estabeleça limites claros: Defina orçamentos para cada categoria de gastos.",
        "3. Mantenha o foco no longo prazo: Visualize seus objetivos regularmente.",
        "4. Celebre pequenas vitórias: Reconheça cada passo dado em direção à sua prosperidade.",
        "A disciplina não é um castigo, mas uma forma de liberdade. Quando você domina seus impulsos, ganha controle sobre seu futuro.",
        "'Pois a visão aguarda um tempo designado; ela fala do fim e não falhará. Ainda que demore, espere por ela; porque certamente virá e não se atrasará.' (Habacuque 2:3)"
      ],
    slug: "capitulo-5",
    ordem: 5,
    liberado: true,
    dataPublicacao: new Date("2025-01-06")
  },
  capitulo6: {
    id: "cap6",
    titulo: "Capítulo 6: O papel da fé no crescimento pessoal",
    conteudo: [
        "A fé não é o oposto da razão, mas seu complemento essencial. Na jornada para a prosperidade, a fé nos mantém firmes quando os números não são favoráveis.",
        "Como a fé opera nas finanças:",
        "1. Fé como fundamento: Acreditar que Deus é seu provedor muda sua relação com o dinheiro.",
        "2. Fé como perspectiva: Ver oportunidades onde outros veem crises.",
        "3. Fé como ação: Tomar decisões corajosas baseadas em princípios, não apenas em circunstâncias.",
        "'Pela fé, entendemos que o universo foi formado pela palavra de Deus, de modo que o que se vê não foi feito do que é visível.' (Hebreus 11:3)",
        "Exercício de Reflexão:",
        "Liste três momentos em sua vida em que a fé fez diferença em suas finanças. Como essas experiências podem guiá-lo hoje?"
      ],
    slug: "capitulo-6",
    ordem: 6,
    liberado: true,
    dataPublicacao: new Date("2025-01-07")
  },
  capitulo7: {
    id: "cap7",
    titulo: "Capítulo 7: Multiplicando seus recursos",
    conteudo: [
        "Multiplicar recursos vai além de acumular - é sobre administrar com sabedoria o que Deus nos confiou.",
        "Estratégias para multiplicação:",
        "1. Invista em conhecimento: 'Adquira sabedoria, adquira entendimento; não se esqueça das minhas palavras nem delas se afaste.' (Provérbios 4:5)",
        "2. Diversifique suas fontes de renda: 'Divida o que você tem em sete partes, ou até em oito, pois você não sabe que desgraça pode sobrevir à terra.' (Eclesiastes 11:2)",
        "3. Reinveste os lucros: 'Quem aumenta sua riqueza com juros e lucros exagerados ajunta para quem tem compaixão dos pobres.' (Provérbios 28:8)",
        "4. Seja generoso: 'Há quem dê generosamente, e vê aumentar suas riquezas; outros retêm o que deveriam dar, e caem na pobreza.' (Provérbios 11:24)",
        "História de Multiplicação:",
        "Assim como Jesus multiplicou os pães e peixes (João 6:1-14), Ele pode multiplicar seus recursos quando você os coloca em Suas mãos."
      ],
    slug: "capitulo-7",
    ordem: 7,
    liberado: true,
    dataPublicacao: new Date("2025-01-08")
  },
  capitulo8: {
    id: "cap8",
    titulo: "Capítulo 8: A importância do descanso e da gratidão",
    conteudo: [
        "Em um mundo obcecado por produtividade, aprender a descansar é um ato revolucionário - e essencial para a verdadeira prosperidade.",
        "Princípios bíblicos sobre descanso:",
        "1. O sábado: 'Lembra-te do dia de sábado, para santificá-lo.' (Êxodo 20:8)",
        "2. O ano sabático: 'No sétimo ano a terra terá um sábado de descanso.' (Levítico 25:4)",
        "3. O descanso de Deus: 'No sétimo dia Deus já havia concluído a obra que realizara, e nesse dia descansou.' (Gênesis 2:2)",
        "A Gratidão como Ferramenta Financeira:",
        "1. Mantém o coração contente: 'Aprendi o segredo de viver contente em toda e qualquer situação.' (Filipenses 4:12)",
        "2. Atrai mais bênçãos: 'Deem graças em todas as circunstâncias.' (1 Tessalonicenses 5:18)",
        "3. Protege contra a ganância: 'Tendo o que comer e com que vestir-nos, estejamos com isso satisfeitos.' (1 Timóteo 6:8)",
        "Exercício Prático:",
        "Comece um diário de gratidão financeira. Toda semana, anote três maneiras pelas quais você viu a provisão de Deus em sua vida."
      ],
    slug: "capitulo-8",
    ordem: 8,
    liberado: true,
    dataPublicacao: new Date("2025-01-09")
  },
  capitulo9: {
    id: "cap9",
    titulo: "Capítulo 9: Liderando sua vida com sabedoria",
    conteudo: [
        "A verdadeira liderança começa com o governo de sua própria vida. Antes de liderar outros, você deve liderar a si mesmo - especialmente em questões financeiras.",
        "Atributos de um Líder Sábio:",
        "1. Visão clara: 'Onde não há visão, o povo perece.' (Provérbios 29:18)",
        "2. Integridade: 'A integridade dos justos os guia.' (Provérbios 11:3)",
        "3. Humildade: 'O temor do Senhor ensina a sabedoria, e a humildade antecede a honra.' (Provérbios 15:33)",
        "4. Coragem: 'Seja forte e corajoso! Não se apavore nem desanime.' (Deuteronômio 31:6)",
        "Liderança Financeira Prática:",
        "1. Seja exemplo em sua casa: Ensine seus filhos sobre finanças sábias.",
        "2. Invista no crescimento de outros: Seja mentor de alguém mais jovem.",
        "3. Deixe um legado: Planeje sua herança material e espiritual.",
        "'Os justos deixam herança para os filhos de seus filhos.' (Provérbios 13:22)"
      ],
    slug: "capitulo-9",
    ordem: 9,
    liberado: true,
    dataPublicacao: new Date("2025-01-10")
  },
  capitulo10: {
    id: "cap10",
    titulo: "Capítulo 10: Construindo um Legado Eterno",
    conteudo: [
      "A verdadeira medida da prosperidade não é o que você acumula, mas o que você deixa para trás.",
      "ELEMENTOS DE UM LEGADO:",
      "1. Valores transmitidos: 'Ensina a criança no caminho em que deve andar.' (Provérbios 22:6)",
      "2. Relacionamentos cultivados",
      "3. Contribuição ao mundo",
      "4. Fé perpetuada",
      "Perguntas finais:",
      "1. Como quero ser lembrado?",
      "2. O que estou fazendo hoje que impactará as próximas gerações?",
      "3. Como meus recursos podem servir a um propósito maior?",
      "Conclusão:",
      "A prosperidade verdadeira é uma jornada que começa com um coração grato e termina com um legado que glorifica a Deus."
    ],
    slug: "capitulo-10",
    ordem: 10,
    liberado: true,
    dataPublicacao: new Date("2025-01-11")
  }
};

const EbookReader = () => {
  const [activeSection, setActiveSection] = useState<string>("introducao");
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [fontSize, setFontSize] = useState(18);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mantido o nome original que você tinha
  const [searchQuery, setSearchQuery] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedData = {
      highlights: localStorage.getItem('highlights'),
      lastSection: localStorage.getItem('lastSection'),
      fontSize: localStorage.getItem('fontSize')
    };
    if (savedData.highlights) {
      try {
        setHighlights(JSON.parse(savedData.highlights));
      } catch (e) {
        console.error("Erro ao carregar destaques:", e);
      }
    }
    if (savedData.lastSection && BOOK_CONTENT[savedData.lastSection as keyof typeof BOOK_CONTENT]) {
      setActiveSection(savedData.lastSection);
    }
    if (savedData.fontSize) {
      const size = Number(savedData.fontSize);
      if (!isNaN(size) && size >= 14 && size <= 24) {
        setFontSize(size);
      }
    }
  }, []);

  const handleDownload = () => {
    setIsDownloading(true);
    setTimeout(() => {
      window.open("/livro.pdf", "_blank");
      setIsDownloading(false);
    }, 1500);
  };

  const addHighlight = () => {
    const selection = window.getSelection();
    if (!selection || !selection.toString().trim()) return;
    const newHighlight: Highlight = {
      id: Date.now().toString(),
      text: selection.toString(),
      section: activeSection,
      createdAt: new Date()
    };
    const updatedHighlights = [...highlights, newHighlight];
    setHighlights(updatedHighlights);
    localStorage.setItem('highlights', JSON.stringify(updatedHighlights));
  };

  const scrollToTop = () => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentSection = BOOK_CONTENT[activeSection as keyof typeof BOOK_CONTENT] || BOOK_CONTENT.introducao;

  const filteredSections = Object.keys(BOOK_CONTENT).filter(key =>
    BOOK_CONTENT[key as keyof typeof BOOK_CONTENT].titulo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Sidebar do Ebook */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 shadow-xl transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
        <div className="p-4 h-full flex flex-col">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Índice</h2>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Buscar capítulo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border bg-white text-gray-900 border-gray-300 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:placeholder-gray-500"
            />
          </div>

          <ul className="flex-1 overflow-y-auto space-y-2">
            {filteredSections.map(sectionId => (
              <li key={sectionId}>
                <button
                  onClick={() => {
                    setActiveSection(sectionId);
                    localStorage.setItem('lastSection', sectionId);
                    setIsSidebarOpen(false); // Fecha ao clicar, independente do tamanho da tela
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors text-sm font-medium 
                    ${activeSection === sectionId
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                    }`}
                >
                  <span className="flex items-center">
                    <BookOpen size={16} className="mr-2.5 flex-shrink-0" />
                    {BOOK_CONTENT[sectionId as keyof typeof BOOK_CONTENT].titulo}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-medium mb-2 text-gray-900 dark:text-white">Seus Destaques</h3>
            <ul className="space-y-2 max-h-40 overflow-y-auto text-sm">
              {highlights
                .filter(h => h.section === activeSection)
                .map(highlight => (
                  <li 
                    key={highlight.id}
                    className="p-2 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-700/30 dark:text-yellow-300"
                  >
                    {highlight.text}
                  </li>
                ))}
              {highlights.filter(h => h.section === activeSection).length === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">Nenhum destaque nesta seção.</p>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */} 
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 shadow-sm p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center max-w-7xl mx-auto">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <BookText size={24} />
            </button>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                <Download size={18} className="mr-2" />
                {isDownloading ? 'Baixando...' : 'Baixar Livro'}
              </button>
            </div>
          </div>
        </header>

        <div 
          ref={contentRef}
          className="flex-1 overflow-y-auto p-6 md:p-10 bg-white dark:bg-gray-800"
        >
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Rumo à Prosperidade</h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                Transformando sua vida financeira, emocional e espiritual
              </p>
              <div className="w-48 h-64 mx-auto relative shadow-xl rounded-lg overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700">
                <Image
                  src="/rumo.pdf.png"
                  alt="Capa do Livro"
                  layout="fill"
                  objectFit="cover"
                  quality={100}
                  priority
                />
              </div>
            </div>

            <article style={{ fontSize: `${fontSize}px` }} className="prose dark:prose-invert max-w-none leading-relaxed sm:leading-loose">
              <h2 className="text-3xl font-bold mb-6 text-blue-600 dark:text-blue-400 border-b pb-2 border-gray-200 dark:border-gray-700">
                {currentSection.titulo}
              </h2>
              
              {currentSection.conteudo.map((paragraph, index) => (
                <p key={index} className="mb-6 text-gray-700 dark:text-gray-300">
                  {paragraph}
                </p>
              ))}
            </article>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex justify-between items-center max-w-4xl mx-auto">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => {
                  const newSize = Math.max(14, fontSize - 1);
                  setFontSize(newSize);
                  localStorage.setItem('fontSize', newSize.toString());
                }}
                className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span className="text-lg">A-</span>
              </button>
              
              <span className="text-sm w-12 text-center text-gray-700 dark:text-gray-300">
                {fontSize}px
              </span>
              
              <button 
                onClick={() => {
                  const newSize = Math.min(24, fontSize + 1);
                  setFontSize(newSize);
                  localStorage.setItem('fontSize', newSize.toString());
                }}
                className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span className="text-lg">A+</span>
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={addHighlight}
                className="flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
              >
                <Bookmark size={18} className="mr-2" />
                Destacar
              </button>
              
              <button
                onClick={scrollToTop}
                className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
              >
                <ArrowUp size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EbookReader;
