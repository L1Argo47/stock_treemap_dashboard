import { useRef, useEffect, useState, useCallback } from 'react';
import { treemap, hierarchy, treemapSquarify } from 'd3';
import type { MarketData, Period, Stock } from '../types/market';
import { getColor } from '../utils/colorScale';
import { formatChange } from '../utils/format';
import Tooltip from './Tooltip';

interface Props {
  data: MarketData;
  period: Period;
}

interface HoverInfo {
  stock: Stock;
  sector: string;
  x: number;
  y: number;
}

interface TreemapNode {
  name: string;
  sector?: string;
  stock?: Stock;
  children?: TreemapNode[];
  value?: number;
}

export default function Treemap({ data, period }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });
  const [hover, setHover] = useState<HoverInfo | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDims({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent, stock: Stock, sector: string) => {
      setHover({ stock, sector, x: e.clientX, y: e.clientY });
    },
    [],
  );

  const handleMouseLeave = useCallback(() => setHover(null), []);

  const { width, height } = dims;

  const root: TreemapNode = {
    name: 'root',
    children: data.sectors.map((s) => ({
      name: s.name,
      children: s.stocks.map((st) => ({
        name: st.name,
        sector: s.name,
        stock: st,
        value: st.marketCap,
      })),
    })),
  };

  const h = hierarchy(root)
    .sum((d) => d.value ?? 0)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  const layout = treemap<TreemapNode>()
    .size([width, height])
    .tile(treemapSquarify)
    .paddingOuter(4)
    .paddingTop(20)
    .paddingInner(2);

  layout(h);

  const sectorNodes = h.children ?? [];

  return (
    <div className="treemap-container" ref={containerRef}>
      {width > 0 && (
        <svg width={width} height={height}>
          {sectorNodes.map((sector) => {
            const sx0 = sector.x0 ?? 0;
            const sy0 = sector.y0 ?? 0;
            const sw = (sector.x1 ?? 0) - sx0;

            return (
              <g key={sector.data.name}>
                {/* Sector background */}
                <rect
                  x={sx0}
                  y={sy0}
                  width={sw}
                  height={(sector.y1 ?? 0) - sy0}
                  fill="none"
                  stroke="#555"
                  strokeWidth={1}
                />
                {/* Sector label */}
                <text
                  x={sx0 + 4}
                  y={sy0 + 14}
                  fill="#999"
                  fontSize={11}
                  fontWeight={600}
                >
                  {sector.data.name}
                </text>

                {/* Stock cells */}
                {(sector.children ?? []).map((leaf) => {
                  const lx = leaf.x0 ?? 0;
                  const ly = leaf.y0 ?? 0;
                  const lw = (leaf.x1 ?? 0) - lx;
                  const lh = (leaf.y1 ?? 0) - ly;
                  const stock = leaf.data.stock!;
                  const change = stock.change[period];
                  const color = getColor(change);
                  const area = lw * lh;
                  const fontSize = Math.max(
                    9,
                    Math.min(16, Math.sqrt(area) / 6),
                  );
                  const showText = lw > 40 && lh > 24;
                  const showChange = lw > 50 && lh > 38;

                  return (
                    <g
                      key={stock.code}
                      onMouseMove={(e) =>
                        handleMouseMove(e, stock, sector.data.name)
                      }
                      onMouseLeave={handleMouseLeave}
                      style={{ cursor: 'pointer' }}
                    >
                      <rect
                        x={lx}
                        y={ly}
                        width={lw}
                        height={lh}
                        fill={color}
                        rx={2}
                      />
                      {showText && (
                        <text
                          x={lx + lw / 2}
                          y={ly + lh / 2 - (showChange ? 4 : 0)}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#fff"
                          fontSize={fontSize}
                          fontWeight={700}
                        >
                          {stock.name}
                        </text>
                      )}
                      {showChange && (
                        <text
                          x={lx + lw / 2}
                          y={ly + lh / 2 + fontSize}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="rgba(255,255,255,0.85)"
                          fontSize={fontSize - 2}
                        >
                          {formatChange(change)}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      )}
      {hover && (
        <Tooltip
          stock={hover.stock}
          sector={hover.sector}
          period={period}
          x={hover.x}
          y={hover.y}
        />
      )}
    </div>
  );
}
