import React, { useState } from 'react';
import { Search, X, RotateCcw } from 'lucide-react';

interface SearchBarProps {
  query: string;
  onSearch: (newQuery: string) => void;
  onReset: () => void;
  isSearching: boolean;
  activeFilterCount: number;
}

const QUICK_TOPICS = [
  { label: 'CVE & Security', query: 'package attack malware vulnerability CVE npm pypi' },
  { label: 'AI Models', query: 'AI model release quantization open weights LLM' },
  { label: 'Software / Frameworks', query: 'React TypeScript Node.js Go Rust release' },
  { label: 'DevTools & Linters', query: 'Vite compiler bundler devtools toolchain' },
];

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onSearch,
  onReset,
  isSearching,
  activeFilterCount,
}) => {
  const [inputValue, setInputValue] = useState(query);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() !== query) {
      onSearch(inputValue.trim());
    }
  };

  const handleReset = () => {
    setInputValue('');
    onReset();
  };

  const handleTopicClick = (topicQuery: string) => {
    setInputValue(topicQuery);
    onSearch(topicQuery);
  };

  return (
    <section className="bg-white border-b border-[#E0E0D0] p-4 flex flex-col gap-2.5 shadow-inner">
      {/* Input Row matching Geometric Balance style */}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative flex items-center">
          <input
            id="main-search-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Query RAG for specific package or tech stack (e.g. 'axios CVE', 'Mistral', 'Go 1.23')..."
            className="w-full border border-[#E0E0D0] px-4 py-2 text-sm focus:outline-none focus:border-[#FF6600] bg-[#FAFAFA] text-[#222222] font-sans pr-8"
          />
          {inputValue && (
            <button
              type="button"
              id="clear-search-btn"
              onClick={() => {
                setInputValue('');
                if (query) onReset();
              }}
              className="absolute right-2.5 text-gray-400 hover:text-black cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Search Button */}
          <button
            type="submit"
            id="submit-search-btn"
            disabled={isSearching}
            className="bg-[#FF6600] hover:bg-[#E65C00] text-black px-6 py-2 text-xs font-bold uppercase transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            {isSearching ? 'Querying...' : 'Search'}
          </button>

          {/* Reset Button */}
          {(query || activeFilterCount > 0) && (
            <button
              type="button"
              id="reset-feed-btn"
              onClick={handleReset}
              className="border border-[#E0E0D0] bg-white px-6 py-2 text-xs font-bold uppercase hover:bg-gray-50 text-[#222222] transition-colors cursor-pointer whitespace-nowrap"
            >
              Reset
            </button>
          )}
        </div>
      </form>

      {/* Suggested Quick Topic Pills */}
      <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
        <span className="text-[10px] font-bold text-gray-500 uppercase font-mono">Quick Topics:</span>
        {QUICK_TOPICS.map((topic, i) => (
          <button
            key={i}
            id={`quick-topic-${i}`}
            type="button"
            onClick={() => handleTopicClick(topic.query)}
            className="text-[11px] px-2.5 py-0.5 bg-[#F6F6EF] border border-[#E0E0D0] hover:border-[#FF6600] text-[#444444] hover:text-black uppercase font-medium transition-colors cursor-pointer"
          >
            {topic.label}
          </button>
        ))}
      </div>
    </section>
  );
};
