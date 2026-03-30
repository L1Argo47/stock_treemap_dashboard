import { useState } from 'react';
import { useMarketData } from './hooks/useMarketData';
import type { Period } from './types/market';
import FilterBar from './components/FilterBar';
import Treemap from './components/Treemap';
import Legend from './components/Legend';
import './App.css';

function App() {
  const { data, loading, error } = useMarketData();
  const [period, setPeriod] = useState<Period>('1d');

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner" />
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="app">
        <div className="error">데이터 로드 실패: {error}</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <FilterBar selected={period} onChange={setPeriod} />
        <span className="updated">업데이트: {data.updated}</span>
      </header>
      <main className="main">
        <Treemap data={data} period={period} />
      </main>
      <Legend />
    </div>
  );
}

export default App;
