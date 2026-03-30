import type { Stock, Period } from '../types/market';
import { formatPrice, formatMarketCap, formatChange } from '../utils/format';

interface Props {
  stock: Stock;
  sector: string;
  period: Period;
  x: number;
  y: number;
}

export default function Tooltip({ stock, sector, period, x, y }: Props) {
  return (
    <div className="tooltip" style={{ left: x + 12, top: y + 12 }}>
      <div className="tooltip-name">{stock.name}</div>
      <div className="tooltip-row">
        <span>현재가</span>
        <span>{formatPrice(stock.price)}</span>
      </div>
      <div className="tooltip-row">
        <span>변동률</span>
        <span>{formatChange(stock.change[period])}</span>
      </div>
      <div className="tooltip-row">
        <span>시가총액</span>
        <span>{formatMarketCap(stock.marketCap)}</span>
      </div>
      <div className="tooltip-row">
        <span>섹터</span>
        <span>{sector}</span>
      </div>
    </div>
  );
}
