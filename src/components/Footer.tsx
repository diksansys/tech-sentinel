import React from 'react';
import { Trash2 } from 'lucide-react';

interface FooterProps {
  onClearCache: () => void;
  isClearingCache: boolean;
  totalArticles: number;
}

export const Footer: React.FC<FooterProps> = ({
  onClearCache,
  isClearingCache,
  totalArticles,
}) => {
  return (
    <footer className="bg-[#F6F6EF] border-t border-[#E0E0D0] px-4 py-3 text-[11px] text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex gap-4 uppercase font-bold flex-wrap">
        <span>Tech Sentinel Wire</span>
        <span>•</span>
        <span>{totalArticles} Articles Loaded</span>
        <span>•</span>
        <button
          id="purge-server-cache-btn"
          onClick={onClearCache}
          disabled={isClearingCache}
          className="hover:text-black uppercase text-gray-500 font-bold transition-colors cursor-pointer flex items-center gap-1"
          title="Clear server-side query cache"
        >
          <Trash2 className="w-3 h-3 text-red-500" />
          <span>{isClearingCache ? 'Purging...' : 'Purge Cache'}</span>
        </button>
      </div>

      <div className="text-gray-400 font-mono text-[10px]">
        Built with RAG Aggregator | No Database Persistence (Cache Only)
      </div>
    </footer>
  );
};
