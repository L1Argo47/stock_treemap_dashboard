import { useState, useEffect } from 'react';
import type { MarketData } from '../types/market';

interface UseMarketDataResult {
  data: MarketData | null;
  loading: boolean;
  error: string | null;
}

export function useMarketData(): UseMarketDataResult {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/market_data.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: MarketData) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}
