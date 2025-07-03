interface MileageCalculationParams {
  amount: number;
  description: string;
  category: string;
  paymentData: {
    cardLastDigits?: string;
    establishment?: string;
  };
}

interface MileageCalculationResult {
  program: string;
  points: number;
  monetaryValue: number;
  cardName?: string;
}

interface PartnerConfig {
  pointsPerReal: number;
  cardPrefixes?: string[];
}

interface ProgramConfig {
  name: string;
  partners: Record<string, PartnerConfig>;
  categoryMultipliers: Record<string, number>;
}

// Configuração de programas e parcerias
const MILEAGE_PROGRAMS: Record<string, ProgramConfig> = {
  SMILES: {
    name: 'Smiles',
    partners: {
      'ITAÚ': { pointsPerReal: 2.5, cardPrefixes: ['4539', '5366'] },
      'SANTANDER': { pointsPerReal: 2.0, cardPrefixes: ['5156', '5426'] },
      'PADRÃO': { pointsPerReal: 1.0 }
    },
    categoryMultipliers: {
      'Viagem': 3,
      'Alimentação': 2,
      'Supermercado': 1.5,
      'Transporte': 2,
      'Restaurante': 2.5
    }
  },
  TUDOAZUL: {
    name: 'TudoAzul',
    partners: {
      'BRADESCO': { pointsPerReal: 2.0, cardPrefixes: ['5522', '4024'] },
      'NUBANK': { pointsPerReal: 1.8, cardPrefixes: ['5162'] },
      'PADRÃO': { pointsPerReal: 0.8 }
    },
    categoryMultipliers: {
      'Viagem': 4,
      'Transporte': 2,
      'Restaurante': 1.8,
      'Supermercado': 1.2
    }
  },
  LATAM_PASS: {
    name: 'Latam Pass',
    partners: {
      'ITAÚ': { pointsPerReal: 2.2, cardPrefixes: ['4539', '5366'] },
      'SANTANDER': { pointsPerReal: 1.8, cardPrefixes: ['5156', '5426'] },
      'PADRÃO': { pointsPerReal: 0.9 }
    },
    categoryMultipliers: {
      'Viagem': 3.5,
      'Transporte': 2.2,
      'Restaurante': 2.0,
      'Supermercado': 1.3
    }
  },
  MULTIPLUS: {
    name: 'Multiplus',
    partners: {
      'ITAÚ': { pointsPerReal: 2.3, cardPrefixes: ['4539', '5366'] },
      'SANTANDER': { pointsPerReal: 1.9, cardPrefixes: ['5156', '5426'] },
      'PADRÃO': { pointsPerReal: 0.9 }
    },
    categoryMultipliers: {
      'Viagem': 3.2,
      'Transporte': 2.1,
      'Restaurante': 1.9,
      'Supermercado': 1.4
    }
  }
};

export function calculateMiles(
  params: MileageCalculationParams,
  userPreferences?: any
): MileageCalculationResult {
  // 1. Determinar o programa preferido do usuário ou detectar automaticamente
  const program = detectProgram(params, userPreferences);
  
  // 2. Calcular pontos base
  const basePoints = calculateBasePoints(params.amount, program, params.paymentData.cardLastDigits);
  
  // 3. Aplicar multiplicadores de categoria
  const categoryMultiplier = getCategoryMultiplier(params.category, program);
  const totalPoints = Math.round(basePoints * categoryMultiplier);
  
  // 4. Calcular valor monetário estimado (R$ por milheiro)
  const monetaryValue = calculateMonetaryValue(totalPoints, program.name);
  
  return {
    program: program.name,
    points: totalPoints,
    monetaryValue,
    cardName: params.paymentData.cardLastDigits ? 
      `Cartão ****${params.paymentData.cardLastDigits}` : undefined
  };
}

// Funções auxiliares
function detectProgram(params: MileageCalculationParams, userPreferences?: any): ProgramConfig {
  if (userPreferences?.defaultProgram) {
    return MILEAGE_PROGRAMS[userPreferences.defaultProgram] || MILEAGE_PROGRAMS.SMILES;
  }
  
  // Detecção automática baseada no cartão
  if (params.paymentData.cardLastDigits) {
    for (const [programName, program] of Object.entries(MILEAGE_PROGRAMS)) {
      for (const [partner, config] of Object.entries(program.partners)) {
        const partnerConfig = config as PartnerConfig;
        if (partnerConfig.cardPrefixes?.some(prefix => 
          params.paymentData.cardLastDigits?.startsWith(prefix))) {
          return program;
        }
      }
    }
  }
  
  // Detecção por estabelecimento
  if (params.paymentData.establishment) {
    const establishment = params.paymentData.establishment.toLowerCase();
    if (establishment.includes('azul') || establishment.includes('tudoazul')) {
      return MILEAGE_PROGRAMS.TUDOAZUL;
    }
    if (establishment.includes('gol') || establishment.includes('smiles')) {
      return MILEAGE_PROGRAMS.SMILES;
    }
    if (establishment.includes('latam') || establishment.includes('latam pass')) {
      return MILEAGE_PROGRAMS.LATAM_PASS;
    }
    if (establishment.includes('tam') || establishment.includes('multiplus')) {
      return MILEAGE_PROGRAMS.MULTIPLUS;
    }
  }
  
  return MILEAGE_PROGRAMS.SMILES; // Default
}

function calculateBasePoints(amount: number, program: ProgramConfig, cardLastDigits?: string) {
  let bestRate = program.partners.PADRÃO.pointsPerReal;
  
  // Encontrar a melhor taxa para o cartão usado
  if (cardLastDigits) {
    for (const [partner, config] of Object.entries(program.partners)) {
      const partnerConfig = config as PartnerConfig;
      if (partnerConfig.cardPrefixes?.some((prefix: string) => cardLastDigits.startsWith(prefix))) {
        if (partnerConfig.pointsPerReal > bestRate) {
          bestRate = partnerConfig.pointsPerReal;
        }
      }
    }
  }
  
  return amount * bestRate;
}

function getCategoryMultiplier(category: string, program: ProgramConfig) {
  if (!category) return 1;
  
  const categoryKey = Object.keys(program.categoryMultipliers).find(key => 
    category.toLowerCase().includes(key.toLowerCase()));
  
  return categoryKey ? program.categoryMultipliers[categoryKey] : 1;
}

function calculateMonetaryValue(points: number, programName: string) {
  // Valores médios por milheiro (atualizáveis)
  const valuePerThousand = {
    'Smiles': 25.00,
    'TudoAzul': 22.50,
    'Latam Pass': 24.00,
    'Multiplus': 23.00
  };
  
  return (points / 1000) * (valuePerThousand[programName as keyof typeof valuePerThousand] || 20.00);
}

// Função para obter recomendações de cartões
export function getCardRecommendations(gastoMensal: number, programasPreferidos: string[] = []) {
  const recommendations = [];
  
  for (const [programName, program] of Object.entries(MILEAGE_PROGRAMS)) {
    if (programasPreferidos.length === 0 || programasPreferidos.includes(program.name)) {
      for (const [partner, config] of Object.entries(program.partners)) {
        if (partner !== 'PADRÃO') {
          const pontosAnuais = gastoMensal * 12 * config.pointsPerReal;
          const valorAnual = (pontosAnuais / 1000) * 25; // Valor médio por milheiro
          
          recommendations.push({
            cartao: `${partner} ${program.name}`,
            programa: program.name,
            pts_por_real: config.pointsPerReal,
            pontos_anuais: Math.round(pontosAnuais),
            valor_anual: Math.round(valorAnual),
            destaque: `${config.pointsPerReal} pts/R$ em todas as compras`
          });
        }
      }
    }
  }
  
  return recommendations.sort((a, b) => b.valor_anual - a.valor_anual);
}

// Função para calcular melhor época de resgate
export function getBestRedemptionTime(programa: string, tipoResgate: string) {
  const seasonalData = {
    'Smiles': {
      'voo': { melhorEpoca: 'Janeiro-Março', motivo: 'Menor demanda pós-férias' },
      'hospedagem': { melhorEpoca: 'Maio-Junho', motivo: 'Baixa temporada' }
    },
    'TudoAzul': {
      'voo': { melhorEpoca: 'Fevereiro-Abril', motivo: 'Promoções de baixa temporada' },
      'hospedagem': { melhorEpoca: 'Julho-Agosto', motivo: 'Ofertas especiais' }
    }
  };
  
  return seasonalData[programa as keyof typeof seasonalData]?.[tipoResgate as keyof typeof seasonalData.Smiles] || 
         { melhorEpoca: 'Ano todo', motivo: 'Disponibilidade constante' };
} 