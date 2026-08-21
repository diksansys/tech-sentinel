import React, { useState } from 'react';
import { ExternalLink, Bookmark, Check, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { TechArticle } from '../types';

interface ArticleItemProps {
  article: TechArticle;
  index: number;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  compactMode: boolean;
}

export const ArticleItem: React.FC<ArticleItemProps> = ({
  article,
  index,
  isBookmarked,
  onToggleBookmark,
  compactMode,
}) => {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = `${article.title}\n\n${article.summary}\n\nSource: ${article.url}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Geometric Balance left column badge helper
  const renderCategoryBox = () => {
    if (article.category === 'security') {
      const severityLabel = article.severity === 'critical' ? 'CRITICAL' : 'ADVISORY';
      return (
        <div className="w-20 sm:w-24 text-center border-r border-[#EEEEEE] flex flex-col justify-center shrink-0 pr-3 sm:pr-4">
          <span className="text-xs font-bold text-red-600 uppercase tracking-tight">
            {severityLabel}
          </span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            SECURITY
          </span>
        </div>
      );
    }
    if (article.category === 'ai') {
      return (
        <div className="w-20 sm:w-24 text-center border-r border-[#EEEEEE] flex flex-col justify-center shrink-0 pr-3 sm:pr-4">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-tight">
            UPDATE
          </span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            AI/ML
          </span>
        </div>
      );
    }
    if (article.category === 'devtools') {
      return (
        <div className="w-20 sm:w-24 text-center border-r border-[#EEEEEE] flex flex-col justify-center shrink-0 pr-3 sm:pr-4">
          <span className="text-xs font-bold text-purple-600 uppercase tracking-tight">
            TOOLING
          </span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            DEVTOOLS
          </span>
        </div>
      );
    }
    return (
      <div className="w-20 sm:w-24 text-center border-r border-[#EEEEEE] flex flex-col justify-center shrink-0 pr-3 sm:pr-4">
        <span className="text-xs font-bold text-green-600 uppercase tracking-tight">
          STABLE
        </span>
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
          SOFTWARE
        </span>
      </div>
    );
  };

  const getDisplayUrl = (urlString: string) => {
    try {
      const parsed = new URL(urlString);
      const host = parsed.hostname.replace(/^www\./, '');
      const path = parsed.pathname.length > 1 ? parsed.pathname : '';
      if (path.length > 25) {
        return `${host}${path.slice(0, 22)}...`;
      }
      return `${host}${path}`;
    } catch {
      return article.source || 'Direct Link';
    }
  };

  const displayUrl = getDisplayUrl(article.url);

  return (
    <article
      id={`article-${article.id}`}
      className="p-4 sm:p-6 bg-white hover:bg-[#F9F9F0] transition-colors flex gap-4 sm:gap-6 border-b border-[#E0E0D0]"
    >
      {/* Left Geometric Classification Box */}
      {renderCategoryBox()}

      {/* Main Article Content */}
      <div className="flex-1 min-w-0">
        {/* Title and Action Link */}
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1">
            <h2 className="font-bold text-base sm:text-lg leading-tight mb-1 text-[#222222]">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#FF6600] transition-colors inline-flex items-center gap-1.5 group"
                title={`Open direct article: ${article.url}`}
              >
                <span>{article.title}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 text-[#FF6600] shrink-0" />
              </a>
            </h2>

            {/* Exact Direct URL deep-link tag */}
            <div className="flex items-center gap-2 mb-1.5">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-mono text-gray-500 hover:text-[#FF6600] bg-[#F6F6EF] px-2 py-0.5 border border-[#E0E0D0] hover:border-[#FF6600] transition-colors"
                title={`Exact link: ${article.url}`}
              >
                <span className="text-gray-400">🔗</span>
                <span className="truncate max-w-[280px] sm:max-w-md">{displayUrl}</span>
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 pt-0.5">
            {/* Bookmark */}
            <button
              type="button"
              onClick={() => onToggleBookmark(article.id)}
              className="text-[#828282] hover:text-[#FF6600] cursor-pointer"
              title={isBookmarked ? "Remove from saved" : "Save article"}
            >
              <Bookmark className="w-4 h-4" fill={isBookmarked ? '#FF6600' : 'none'} color={isBookmarked ? '#FF6600' : 'currentColor'} />
            </button>

            {/* External Link */}
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#828282] hover:text-[#FF6600] transition-colors p-1"
              title={`Read source at ${article.url}`}
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Insight Summary */}
        {!compactMode && (
          <p className="text-sm text-gray-600 leading-relaxed max-w-4xl mt-1">
            {article.summary}
          </p>
        )}

        {/* Technical Impact Bar if available */}
        {article.impact && !compactMode && (
          <div className="mt-2.5 px-3 py-1.5 bg-[#F6F6EF] border-l-2 border-[#FF6600] text-xs font-mono text-[#333333]">
            {article.impact}
          </div>
        )}

        {/* Key Signals expandable */}
        {article.keyPoints && article.keyPoints.length > 0 && showDetails && (
          <div className="mt-2.5 p-3 bg-[#FAFAFA] border border-[#E0E0D0] text-xs">
            <div className="font-bold text-gray-700 uppercase text-[10px] mb-1">Key Technical Signals:</div>
            <ul className="space-y-1 text-gray-600 list-disc list-inside">
              {article.keyPoints.map((point, pIdx) => (
                <li key={pIdx}>{point}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Meta Bar */}
        <div className="mt-3 flex items-center justify-between text-xs text-gray-400 flex-wrap gap-2 pt-1">
          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-700">{article.source}</span>
            <span>•</span>
            <span className="font-mono">{article.publishedAt}</span>
            {article.readingTime && (
              <>
                <span>•</span>
                <span className="font-mono">{article.readingTime}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] uppercase font-bold text-[#FF6600] hover:underline flex items-center gap-1"
            >
              <span>Read Full Article</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {article.keyPoints && article.keyPoints.length > 0 && (
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="text-[11px] uppercase font-bold text-gray-500 hover:text-black flex items-center gap-0.5 cursor-pointer"
              >
                <span>{showDetails ? 'Hide Details' : 'Details'}</span>
                {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}

            <button
              type="button"
              onClick={handleCopy}
              className="text-[11px] uppercase font-bold text-gray-500 hover:text-black flex items-center gap-1 cursor-pointer"
              title="Copy details"
            >
              {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
