import React, { useState, useRef, useEffect } from 'react';

interface Props {
  heatmapData: Record<string, number>;
}

export const Heatmap: React.FC<Props> = ({ heatmapData }) => {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [containerW, setContainerW] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setContainerW(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const today = new Date();
  const GUTTER = 30; // left gutter for day labels
  const TOP = 20;    // top gutter for month labels
  const Gap = 3;
  const weeks = 53;
  const daysInWeek = 7;
  // padX absorbs the left gutter so the total layout width matches the container
  const padX = containerW > 0 ? GUTTER : GUTTER;
  const availW = Math.max(containerW - padX - 8, 100);
  const cellSize = Math.max(Math.floor((availW - (weeks - 1) * Gap) / weeks), 4);
  const totalW = padX + weeks * (cellSize + Gap) - Gap;
  const totalH = TOP + daysInWeek * (cellSize + Gap) - Gap;

  const getColor = (count: number) => {
    if (count === 0) return 'var(--color-track)';
    if (count <= 2) return '#0e4429';
    if (count <= 4) return '#006d32';
    if (count <= 6) return '#26a641';
    return '#39d353';
  };

  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (weeks * daysInWeek - 1));
  startDate.setDate(startDate.getDate() - startDate.getDay()); // align to sunday

  const cells = [];
  const monthLabels = [];
  let currentMonth = -1;

  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < daysInWeek; d++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + (w * daysInWeek + d));

      if (date > today) break;

      if (d === 0) {
        if (date.getMonth() !== currentMonth && w > 0) {
          monthLabels.push({
            x: GUTTER + w * (cellSize + Gap) + cellSize / 2,
            label: date.toLocaleString('default', { month: 'short' }),
          });
          currentMonth = date.getMonth();
        } else if (currentMonth === -1) {
          currentMonth = date.getMonth();
        }
      }

      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const dt = String(date.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dt}`;
      const count = heatmapData[dateStr] || 0;

      cells.push({
        x: GUTTER + w * (cellSize + Gap),
        y: TOP + d * (cellSize + Gap),
        dateStr,
        count,
        color: getColor(count),
        size: cellSize,
      });
    }
  }

  // recenter month label x within its cell
  const monthLabelX = (x: number) => Math.min(Math.max(x, GUTTER + cellSize), totalW - cellSize / 2);

  const handleMouseEnter = (e: React.MouseEvent, text: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      x: rect.left + window.scrollX + rect.width / 2,
      y: rect.top + window.scrollY - 34,
      text,
    });
  };

  return (
    <div ref={wrapRef} className="w-full overflow-x-auto">
      <div className="relative" style={{ width: totalW, height: totalH + 36 }}>
        <svg width={totalW} height={totalH} className="block text-[var(--color-text-dim)] font-mono text-[10px]">
          {monthLabels.map((m, i) => (
            <text key={i} x={monthLabelX(m.x)} y={14} textAnchor="middle" fill="currentColor">{m.label}</text>
          ))}

          <text x={GUTTER - 6} y={TOP + 1 * (cellSize + Gap) + cellSize / 2 + 3} textAnchor="end" fill="currentColor">Mon</text>
          <text x={GUTTER - 6} y={TOP + 3 * (cellSize + Gap) + cellSize / 2 + 3} textAnchor="end" fill="currentColor">Wed</text>
          <text x={GUTTER - 6} y={TOP + 5 * (cellSize + Gap) + cellSize / 2 + 3} textAnchor="end" fill="currentColor">Fri</text>

          {cells.map((c, i) => (
            <rect
              key={i}
              x={c.x}
              y={c.y}
              width={c.size}
              height={c.size}
              fill={c.color}
              rx={2}
              ry={2}
              onMouseEnter={(e) => handleMouseEnter(e, `${c.count} solves on ${c.dateStr}`)}
              onMouseLeave={() => setTooltip(null)}
              className="transition-colors cursor-default hover:stroke-white hover:stroke-1"
            />
          ))}
        </svg>
      </div>

      <div className="flex items-center justify-end gap-1 mt-2 text-xs font-mono text-[var(--color-text-dim)]">
        <span>Less</span>
        {['var(--color-track)', '#0e4429', '#006d32', '#26a641', '#39d353'].map((c, i) => (
          <div key={i} className="w-[11px] h-[11px] rounded-[2px]" style={{ backgroundColor: c }}></div>
        ))}
        <span>More</span>
      </div>

      {tooltip && (
        <div
          className="fixed z-50 bg-[var(--color-surface)] text-[var(--color-text)] text-xs font-mono px-2 py-1 rounded border border-[var(--color-border)] pointer-events-none -translate-x-1/2"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
};
