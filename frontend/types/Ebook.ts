// src/types/Ebook.ts
export interface Capitulo {
    id: string; // ID único do capítulo
    titulo: string;
    conteudo: string[]; // Array de parágrafos
    slug: string; // URL amigável (ex: "introducao")
    ordem: number; // Ordem de exibição
    liberado: boolean; // Se o capítulo está disponível
    dataPublicacao: Date;
    palavrasChave?: string[]; // Opcional para SEO
  }
  
  export interface Ebook {
    id: string;
    titulo: string;
    autor: string;
    descricao: string;
    capa: string; // URL da imagem
    capitulos: Capitulo[];
    dataPublicacao: Date;
    isbn?: string; // Opcional
    categorias: string[];
    premium: boolean;
  }
  
  // Tipo para destaques/anotações
  export interface DestaqueEbook {
    id: string;
    usuarioId: string;
    capituloId: string;
    texto: string;
    cor: string; // Ex: "#FFEB3B"
    posicao?: { // Para localização no texto
      paragrafo: number;
      inicio: number;
      fim: number;
    };
    criadoEm: Date;
    atualizadoEm: Date;
  }