import React from 'react';
import { RefreshCw, Bookmark, Database } from 'lucide-react';
import { NewsCategory } from '../types';

interface HeaderProps {
  currentCategory: NewsCategory;
  onSelectCategory: (category: NewsCategory) => void;
  isFetching: boolean;
  onRefresh: () => void;
  isCached: boolean;
  cacheTimestamp: number;
  liveGrounded?: boolean;
  bookmarkedCount: number;
  showBookmarksOnly: boolean;
  onToggleBookmarks: () => void;
  compactMode: boolean;
  onToggleCompact: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentCategory,
  onSelectCategory,
  isFetching,
  onRefresh,
  isCached,
  cacheTimestamp,
  liveGrounded,
  bookmarkedCount,
  showBookmarksOnly,
  onToggleBookmarks,
  compactMode,
  onToggleCompact,
}) => {
  const getCacheAgeString = (): string => {
    if (!cacheTimestamp) return 'Live Fresh';
    const diffSec = Math.floor((Date.now() - cacheTimestamp) / 1000);
    if (diffSec < 45) return 'Just synced';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    return `${Math.floor(diffMin / 60)}h ago`;
  };

  const categories: { key: NewsCategory; label: string }[] = [
    { key: 'all', label: 'All News' },
    { key: 'security', label: 'Vulnerabilities' },
    { key: 'ai', label: 'AI Updates' },
    { key: 'software', label: 'Software' },
    { key: 'devtools', label: 'Dev Tools' },
  ];

  return (
    <header className="bg-[#FF6600] px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between shadow-sm gap-2 border-b border-[#E65C00] select-none">
      {/* Brand area */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-black text-white px-2.5 py-1 font-bold text-base font-mono">
            T
          </div>
          <h1 className="font-bold text-sm tracking-tight uppercase text-black flex items-center">
            <span>Tech Sentinel</span>
            <span className="font-normal opacity-70 ml-1.5 hidden sm:inline">| Live Tech Wire</span>
          </h1>
        </div>

        {/* Mobile Live indicator */}
        <div className="md:hidden flex items-center gap-1.5 bg-black/10 px-2 py-0.5 text-[10px] font-bold uppercase text-black">
          <div className={`w-2 h-2 rounded-full ${isCached ? 'bg-amber-400' : 'bg-green-600 animate-pulse'}`} />
          <span>{isCached ? `Cache (${getCacheAgeString()})` : 'Live RAG'}</span>
        </div>
      </div>

      {/* Category Pills Navigation */}
      <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto text-xs font-bold uppercase tracking-wider scrollbar-none py-0.5">
        {categories.map((cat) => {
          const isActive = currentCategory === cat.key && !showBookmarksOnly;
          return (
            <button
              key={cat.key}
              id={`cat-btn-${cat.key}`}
              onClick={() => {
                if (showBookmarksOnly) onToggleBookmarks();
                onSelectCategory(cat.key);
              }}
              className={`px-2.5 py-1 text-[11px] transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-black text-white font-extrabold'
                  : 'text-black/80 hover:text-black hover:bg-black/10'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-2 text-xs font-bold uppercase justify-end">
        {/* Desktop Live RAG indicator */}
        <div className="hidden lg:flex items-center gap-1.5 bg-black/10 px-2.5 py-1 text-[10px] text-black">
          <div className={`w-2 h-2 rounded-full ${isCached ? 'bg-amber-300' : 'bg-green-500 animate-pulse'}`} />
          <span>{isCached ? `Cached: ${getCacheAgeString()}` : 'Live Web Grounded'}</span>
        </div>

        {/* Sync Button */}
        <button
          id="refresh-feed-btn"
          onClick={onRefresh}
          disabled={isFetching}
          className="bg-black hover:bg-[#222222] text-white px-3 py-1 text-xs font-bold uppercase transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
          title="Force refresh live web grounding"
        >
          <RefreshCw className={`w-3 h-3 text-[#FF6600] ${isFetching ? 'animate-spin' : ''}`} />
          <span>{isFetching ? 'Syncing...' : 'Sync Live'}</span>
        </button>

        {/* Bookmarks Toggle */}
        <button
          id="toggle-bookmarks-btn"
          onClick={onToggleBookmarks}
          className={`px-2.5 py-1 text-xs font-bold uppercase transition-colors border cursor-pointer flex items-center gap-1 ${
            showBookmarksOnly
              ? 'bg-black text-white border-black'
              : 'bg-white hover:bg-gray-100 text-black border-[#E0E0D0]'
          }`}
        >
          <Bookmark className="w-3 h-3" fill={showBookmarksOnly ? 'white' : 'none'} />
          <span>Saved ({bookmarkedCount})</span>
        </button>

        {/* Compact Toggle */}
        <button
          id="toggle-compact-btn"
          onClick={onToggleCompact}
          className="hidden sm:inline-block border border-black/30 bg-white/70 hover:bg-white px-2 py-1 text-[10px] font-bold uppercase cursor-pointer"
        >
          {compactMode ? 'Expanded' : 'Compact'}
        </button>
      </div>
    </header>
  );
};
