import React from 'react';
import { getExportUrl } from '../api';

interface Props {
  userId: number;
  format: 'json' | 'csv';
}

export const ExportButton: React.FC<Props> = ({ userId, format }) => {
  const handleClick = () => {
    window.open(getExportUrl(userId, format), '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className="px-4 py-2 border border-[var(--color-border)] rounded text-sm text-[var(--color-text-dim)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] transition-colors uppercase font-mono"
    >
      Export {format.toUpperCase()}
    </button>
  );
};
