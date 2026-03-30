export type Period = '1d' | '1w' | '1m' | '3m' | '6m' | '1y';

export interface Change {
  '1d': number;
  '1w': number;
  '1m': number;
  '3m': number;
  '6m': number;
  '1y': number;
}

export interface Stock {
  code: string;
  name: string;
  price: number;
  marketCap: number;
  change: Change;
}

export interface Sector {
  name: string;
  stocks: Stock[];
}

export interface MarketData {
  date: string;
  updated: string;
  sectors: Sector[];
}
