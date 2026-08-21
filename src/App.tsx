import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { ExecutiveBrief } from './components/ExecutiveBrief';
import { ArticleItem } from './components/ArticleItem';
import { Footer } from './components/Footer';
import { TechArticle, NewsCategory, NewsResponse } from './types';
import { AlertCircle, Bookmark, Sparkles } from 'lucide-react';

export default function App() {
  const [articles, setArticles] = useState<TechArticle[]>([]);
  const [category, setCategory] = useState<NewsCategory>('all');
  const [query, setQuery] = useState<string>('');
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState<boolean>(false);
  const [cacheTimestamp, setCacheTimestamp] = useState<number>(0);
  const [sourcesCount, setSourcesCount] = useState<number>(0);
  const [executiveSummary, setExecutiveSummary] = useState<NewsResponse['executiveSummary']>();

  // Local state persistence for bookmarks
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('tech_digest_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showBookmarksOnly, setShowBookmarksOnly] = useState<boolean>(false);
  const [compactMode, setCompactMode] = useState<boolean>(false);
  const [isClearingCache, setIsClearingCache] = useState<boolean>(false);

  // Sync bookmarks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('tech_digest_bookmarks', JSON.stringify(bookmarkedIds));
    } catch (e) {
      console.error('Failed to save bookmarks:', e);
    }
  }, [bookmarkedIds]);

  const toggleBookmark = (id: string) => {
    setBookmarkedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Fetch news from API
  const fetchNews = useCallback(async (searchQuery = query, cat = category, forceRefresh = false) => {
    setIsFetching(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (cat && cat !== 'all') params.set('category', cat);
      if (forceRefresh) params.set('refresh', 'true');

      const response = await fetch(`/api/news?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch tech newsletter (status: ${response.status})`);
      }

      const data: NewsResponse = await response.json();
      setArticles(data.articles || []);
      setIsCached(data.cached);
      setCacheTimestamp(data.cacheTimestamp || Date.now());
      setSourcesCount(data.sourcesCount || data.articles.length);
      setExecutiveSummary(data.executiveSummary);
    } catch (err: any) {
      console.error('Error fetching news:', err);
      setError(err.message || 'Unable to retrieve latest tech feed. Please try again.');
    } finally {
      setIsFetching(false);
    }
  }, [query, category]);

  // Initial load
  useEffect(() => {
    fetchNews(query, category, false);
  }, [category]);

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    setShowBookmarksOnly(false);
    fetchNews(newQuery, category, false);
  };

  const handleReset = () => {
    setQuery('');
    setCategory('all');
    setShowBookmarksOnly(false);
    fetchNews('', 'all', false);
  };

  const handleRefresh = () => {
    fetchNews(query, category, true);
  };

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      await fetch('/api/cache/clear', { method: 'POST' });
      await fetchNews(query, category, true);
    } catch (err) {
      console.error('Error clearing cache:', err);
    } finally {
      setIsClearingCache(false);
    }
  };

  // Filtered displayed articles
  const displayedArticles = articles.filter(article => {
    if (showBookmarksOnly) {
      return bookmarkedIds.includes(article.id);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F6F6EF] text-[#222222] font-sans antialiased flex flex-col selection:bg-[#FF6600]/30">
      {/* Header with Geometric Balance orange banner */}
      <Header
        currentCategory={category}
        onSelectCategory={(cat) => setCategory(cat)}
        isFetching={isFetching}
        onRefresh={handleRefresh}
        isCached={isCached}
        cacheTimestamp={cacheTimestamp}
        bookmarkedCount={bookmarkedIds.length}
        showBookmarksOnly={showBookmarksOnly}
        onToggleBookmarks={() => setShowBookmarksOnly(!showBookmarksOnly)}
        compactMode={compactMode}
        onToggleCompact={() => setCompactMode(!compactMode)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col max-w-6xl w-full mx-auto shadow-sm border-x border-[#E0E0D0] bg-[#F6F6EF]">
        {/* Search Bar */}
        <SearchBar
          query={query}
          onSearch={handleSearch}
          onReset={handleReset}
          isSearching={isFetching}
          activeFilterCount={(query ? 1 : 0) + (category !== 'all' ? 1 : 0) + (showBookmarksOnly ? 1 : 0)}
        />

        {/* Executive Threat Radar */}
        {!showBookmarksOnly && articles.length > 0 && !query && (
          <ExecutiveBrief
            articles={articles}
            executiveSummary={executiveSummary}
            sourcesCount={sourcesCount}
          />
        )}

        {/* Status Strip */}
        <div className="px-4 py-2 bg-[#EFEFE7] text-[10px] font-bold text-gray-500 uppercase flex justify-between items-center border-b border-[#E0E0D0]">
          <span>
            {showBookmarksOnly
              ? `Saved Articles (${displayedArticles.length})`
              : query
              ? `Search: "${query}"`
              : category === 'all'
              ? 'Latest Aggregated Feeds'
              : `${category.toUpperCase()} Feed`}
          </span>
          <span className="font-mono">
            {isFetching ? 'Updating RAG...' : `Showing ${displayedArticles.length} Relevant Feeds`}
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="m-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={handleRefresh}
              className="px-3 py-1 bg-white border border-red-300 text-red-700 text-xs font-bold uppercase hover:bg-red-50 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {isFetching && articles.length === 0 && (
          <div className="divide-y divide-[#E0E0D0] bg-white animate-pulse">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="p-6 flex gap-6">
                <div className="w-24 h-12 bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="w-2/3 h-5 bg-gray-200" />
                  <div className="w-full h-10 bg-gray-100" />
                  <div className="w-1/4 h-3 bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isFetching && displayedArticles.length === 0 && (
          <div className="py-16 text-center bg-white p-6 my-4 border border-[#E0E0D0] mx-4">
            <div className="w-10 h-10 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center mx-auto mb-3">
              {showBookmarksOnly ? <Bookmark className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <h3 className="font-bold text-sm text-[#222222] uppercase mb-1">
              {showBookmarksOnly ? 'No Saved Articles' : 'No Matching Tech Feeds Found'}
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mb-4">
              {showBookmarksOnly
                ? 'Save articles using the bookmark icon to review them offline.'
                : 'Try adjusting your search query or reset to view the full live feed.'}
            </p>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-[#FF6600] hover:bg-[#E65C00] text-black text-xs font-bold uppercase transition-colors cursor-pointer"
            >
              Reset to Default
            </button>
          </div>
        )}

        {/* Main Feed with Geometric Balance divide-y */}
        <main className="flex-1 bg-white divide-y divide-[#E0E0D0]">
          {displayedArticles.map((article, idx) => (
            <ArticleItem
              key={article.id || idx}
              article={article}
              index={idx}
              isBookmarked={bookmarkedIds.includes(article.id)}
              onToggleBookmark={toggleBookmark}
              compactMode={compactMode}
            />
          ))}
        </main>
      </div>

      {/* Footer */}
      <Footer
        onClearCache={handleClearCache}
        isClearingCache={isClearingCache}
        totalArticles={articles.length}
      />
    </div>
  );
}
