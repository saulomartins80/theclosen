// types/market.ts
export interface MarketIndices {
  [key: string]: number;
}

export interface MarketData {
  stocks: any[];
  cryptos: any[];
  indices: MarketIndices;
  lastUpdated: string;
}

export interface CustomIndex {
  symbol: string;
  name: string;
}