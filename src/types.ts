export type NewsCategory = 'all' | 'security' | 'ai' | 'software' | 'devtools';

export interface TechArticle {
  id: string;
  title: string;
  category: 'security' | 'ai' | 'software' | 'devtools';
  summary: string;
  impact?: string;
  source: string;
  url: string;
  publishedAt: string;
  tags: string[];
  readingTime?: string;
  severity?: 'critical' | 'high' | 'medium' | 'info';
  keyPoints?: string[];
}

export interface NewsResponse {
  articles: TechArticle[];
  query?: string;
  category?: string;
  cached: boolean;
  cacheTimestamp: number;
  sourcesCount: number;
  executiveSummary?: {
    securityHighlight: string;
    aiHighlight: string;
    softwareHighlight: string;
  };
}
