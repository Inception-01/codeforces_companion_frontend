import React from 'react';
import { useProfile } from '../hooks/useProfile';
import { RATING_BANDS, ratingColor, ratingLabel } from '../utils/colors';
import { PageHeader, Section, Card, StatCard, Spinner, Empty } from './ui';

export const ProfilePage: React.FC<{ userId: number }> = ({ userId }) => {
  const { profile, loading, error } = useProfile(userId);

  if (loading && !profile) return (
    <div className="flex items-center gap-3 font-mono text-[var(--color-text-dim)]"><Spinner /> Loading profile...</div>
  );
  if (error) return <div className="font-mono text-[var(--color-red)]">Error: {error}</div>;
  if (!profile) return null;

  return (
    <div className="space-y-2 pb-8">
      <PageHeader
        title={profile.handle}
        subtitle="Your live Codeforces profile summary."
      />

      <Section num="01" title="Overview">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <StatCard title="Handle" value={profile.handle} color="var(--color-accent)" hint={profile.handle.length > 24 ? 'long handle' : undefined} />
          <StatCard
            title="Problems Solved"
            value={profile.totalSolved.toLocaleString()}
            color="var(--color-green)"
          />
          <StatCard
            title="Current Rating"
            value={profile.rating != null ? profile.rating.toLocaleString() : 'Unrated'}
            color={ratingColor(profile.rating)}
            hint={profile.rating != null ? ratingLabel(profile.rating) : undefined}
          />
        </div>
        {profile.maxRating != null && (
          <Card className="mt-3 p-5">
            <h3 className="font-mono text-sm text-[var(--color-text-dim)] uppercase mb-1">Max Rating</h3>
            <div className="font-mono text-2xl font-bold" style={{ color: ratingColor(profile.maxRating) }}>
              {profile.maxRating.toLocaleString()}
            </div>
          </Card>
        )}
      </Section>

      <Section num="02" title="Rating History">
        <Card className="p-4 md:p-5">
          {profile.ratingHistory.length === 0 ? (
            <Empty>No rating history available.</Empty>
          ) : (
            <RatingGraph history={profile.ratingHistory} />
          )}
        </Card>
      </Section>
    </div>
  );
};

interface RatingPoint {
  rating: number;
  oldRating: number;
  time: number;
  contestName: string;
  rank: number;
}

const RatingGraph: React.FC<{ history: RatingPoint[] }> = ({ history }) => {
  const W = 760;
  const H = 300;
  const PAD = { top: 16, right: 16, bottom: 32, left: 48 };

  const values = history.map(h => h.rating);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  // Round min down to a band boundary, max up, so CF band colors align nicely
  const minVal = Math.max(0, Math.floor(rawMin / 100) * 100 - 100);
  const maxVal = Math.ceil(rawMax / 100) * 100 + 100;
  const span = maxVal - minVal || 1;
  const minTime = history[0].time;
  const maxTime = history[history.length - 1].time;
  const timeSpan = maxTime - minTime || 1;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const x = (t: number) => PAD.left + ((t - minTime) / timeSpan) * innerW;
  const y = (v: number) => PAD.top + innerH - ((v - minVal) / span) * innerH;

  const [hover, setHover] = React.useState<{ idx: number; px: number; py: number } | null>(null);

  // background bands crossing the y-range
  const bands = RATING_BANDS
    .map((b, i) => {
      const top = Math.max(minVal, b.min);
      const bottom = Math.min(maxVal, b.max);
      if (bottom <= top) return null;
      return {
        ...b,
        key: i,
        yTop: y(top),
        yBottom: y(bottom),
      };
    })
    .filter(Boolean) as Array<{ key: number; label: string; color: string; yTop: number; yBottom: number }>;

  const yTicks = 6;
  const yTicksArr = Array.from({ length: yTicks + 1 }, (_, i) => minVal + (span * i) / yTicks);

  const xTicks = Math.min(6, history.length);

  // CF-style band boundary lines (only those crossing the visible range)
  const boundaries = RATING_BANDS
    .filter(b => b.min > minVal && b.min < maxVal)
    .map((b, i) => ({ value: b.min, label: b.label, y: y(b.min), color: b.color, key: i }));

  const areaPath = history.map((h, i) => {
    const p = `${x(h.time)},${y(h.rating)}`;
    return (i === 0 ? `M${p}` : `L${p}`);
  }).join(' ') + ` L${x(history[history.length - 1].time)},${PAD.top + innerH} L${x(history[0].time)},${PAD.top + innerH} Z`;

  const hoverPoint = hover ? history[hover.idx] : null;
  const delta = hoverPoint ? hoverPoint.rating - hoverPoint.oldRating : 0;
  const last = history[history.length - 1];

  return (
    <div className="relative w-full">
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full min-w-[640px]"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Codeforces-style rating history chart"
        >
          <defs>
            <linearGradient id="ratingAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ratingColor(last.rating)} stopOpacity="0.28" />
              <stop offset="100%" stopColor={ratingColor(last.rating)} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* rating band backgrounds */}
          {bands.map(b => (
            <rect
              key={b.key}
              x={PAD.left}
              y={b.yTop}
              width={innerW}
              height={b.yBottom - b.yTop}
              fill={b.color}
              opacity="0.08"
            />
          ))}

          {yTicksArr.map((tv, i) => (
            <g key={i}>
              <line x1={PAD.left} y1={y(tv)} x2={W - PAD.right} y2={y(tv)} stroke="var(--color-border)" strokeWidth={1} />
              <text x={PAD.left - 6} y={y(tv) + 4} textAnchor="end" fontSize="10" fill="var(--color-text-dim)" fontFamily="monospace">
                {Math.round(tv)}
              </text>
            </g>
          ))}

          {/* band boundary dashed lines + labels (CF signature) */}
          {boundaries.map(b => (
            <g key={b.key}>
              <line
                x1={PAD.left} y1={b.y} x2={W - PAD.right} y2={b.y}
                stroke={b.color} strokeWidth={1} strokeDasharray="2 3" opacity="0.6"
              />
              <text x={W - PAD.right - 4} y={b.y + 3} textAnchor="end" fontSize="9" fill={b.color} fontFamily="monospace" opacity="0.85">
                {b.label}
              </text>
            </g>
          ))}

          {Array.from({ length: xTicks + 1 }, (_, i) => {
            const t = minTime + (timeSpan * i) / xTicks;
            const date = new Date(t);
            return (
              <text key={i} x={x(t)} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--color-text-dim)" fontFamily="monospace">
                {`${date.getMonth() + 1}/${date.getDate()}/${String(date.getFullYear()).slice(2)}`}
              </text>
            );
          })}

          {/* area fill under the line */}
          <path d={areaPath} fill="url(#ratingAreaGrad)" stroke="none" />

          {/* hover guide */}
          {hover && hoverPoint && (
            <g>
              <line
                x1={x(hoverPoint.time)}
                y1={PAD.top}
                x2={x(hoverPoint.time)}
                y2={PAD.top + innerH}
                stroke="var(--color-text-faint)"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            </g>
          )}

          {/* last point marker ring */}
          <circle
            cx={x(last.time)}
            cy={y(last.rating)}
            r="8"
            fill="none"
            stroke={ratingColor(last.rating)}
            strokeWidth="1.5"
            opacity="0.55"
          />

          <polyline
            points={history.map(h => `${x(h.time)},${y(h.rating)}`).join(' ')}
            fill="none"
            stroke={ratingColor(last.rating)}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {history.map((h, i) => (
            <circle
              key={i}
              cx={x(h.time)}
              cy={y(h.rating)}
              r={hover && hover.idx === i ? 5 : 3}
              fill={ratingColor(h.rating)}
              stroke={i === history.length - 1 ? ratingColor(h.rating) : 'var(--color-bg)'}
              strokeWidth={hover && hover.idx === i ? 2 : i === history.length - 1 ? 2 : 1}
            />
          ))}

          {history.map((h, i) => (
            <rect
              key={`hit-${i}`}
              x={x(h.time) - 14}
              y={PAD.top}
              width={i === history.length - 1 ? 28 : (x(history[i + 1]?.time ?? h.time) - x(h.time)) + 14}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHover({ idx: i, px: x(h.time), py: y(h.rating) })}
              onMouseMove={(e) => {
                const svg = (e.currentTarget.ownerSVGElement as SVGSVGElement | null);
                if (!svg) return;
                const rect = svg.getBoundingClientRect();
                const scaleX = rect.width / W;
                const scaleY = rect.height / H;
                setHover({ idx: i, px: (e.clientX - rect.left) / scaleX, py: (e.clientY - rect.top) / scaleY });
              }}
              onMouseLeave={() => setHover(null)}
            />
          ))}
        </svg>
      </div>

      {/* tooltip */}
      {hover && hoverPoint && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 shadow-[var(--color-card-shadow)]"
          style={{
            left: 0,
            top: 0,
            transform: `translate(${Math.min(Math.max(hover.px - 100, 8), W * 0.66)}px, ${Math.max(hover.py - 84, 8)}px)`,
            maxWidth: 220,
          }}
        >
          <div className="font-mono text-xs font-semibold leading-snug" style={{ color: ratingColor(hoverPoint.rating) }}>
            {hoverPoint.contestName}
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-4 font-mono text-xs">
            <span className="text-[var(--color-text-dim)]">
              {new Date(hoverPoint.time).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-[var(--color-text)]">
              {hoverPoint.rating} <span className={delta >= 0 ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}>({delta >= 0 ? '+' : ''}{delta})</span>
            </span>
          </div>
          <div className="mt-1 font-mono text-xs text-[var(--color-text-dim)]">
            rank <span className="text-[var(--color-text)]">{hoverPoint.rank}</span>
            <span className="ml-2 text-[var(--color-text-faint)]">{ratingLabel(hoverPoint.rating)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
