import type { Period } from '../types/market';

const FILTERS: { label: string; value: Period }[] = [
  { label: '1일', value: '1d' },
  { label: '1주', value: '1w' },
  { label: '1개월', value: '1m' },
  { label: '3개월', value: '3m' },
  { label: '6개월', value: '6m' },
  { label: '1년', value: '1y' },
];

interface Props {
  selected: Period;
  onChange: (period: Period) => void;
}

export default function FilterBar({ selected, onChange }: Props) {
  return (
    <div className="filter-bar">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          className={`filter-btn ${selected === f.value ? 'active' : ''}`}
          onClick={() => onChange(f.value)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
