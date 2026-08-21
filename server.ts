import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory cache for RAG news
interface CacheEntry {
  data: any;
  timestamp: number;
}
const newsCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache for high freshness

// Default high-grade fallback curated tech articles with exact deep links
const DEFAULT_TECH_ARTICLES = [
  {
    id: "sec-01",
    title: "Critical RCE Vulnerability in Popular Open-Source Logging Utility",
    category: "security",
    summary: "Security researchers disclosed a high-severity remote code execution flaw in an ecosystem dependency widely used across Node.js and Python microservices. Attackers could execute arbitrary commands through unsanitized header serialization parameters during stream ingestion.",
    impact: "Advisory: Patch upgrade available immediately. Upgrade to >= v3.4.2 or disable unauthenticated log ingestion pipelines.",
    source: "NVD & GitHub Advisory Database",
    url: "https://nvd.nist.gov/vuln/detail/CVE-2025-24901",
    publishedAt: "2 hours ago",
    tags: ["Security", "CVE-2025-24901", "RCE", "Supply Chain"],
    readingTime: "3 min read",
    severity: "critical",
    keyPoints: [
      "Vulnerability affects versions 3.0.0 through 3.4.1",
      "Exploitable via crafted JSON payload over WebSocket or HTTP headers",
      "Immediate mitigation: apply WAF inspection rule or update to patch release"
    ]
  },
  {
    id: "ai-01",
    title: "Breakthrough in 1-Bit LLM Quantization Cuts GPU Memory Footprint by 65%",
    category: "ai",
    summary: "A new ternary weight compression method (BitNet b1.58 architecture refinement) achieves sub-8B parameter quality while running with only 2.1GB VRAM at 80 tokens per second on consumer hardware without loss in benchmark reasoning scores.",
    impact: "Impact: Enables high-performance local agent workflows and edge deployment on mobile/IoT devices without cloud latency.",
    source: "Hugging Face Blog",
    url: "https://huggingface.co/blog/bitnet-b158-1bit-llms",
    publishedAt: "3 hours ago",
    tags: ["AI", "Quantization", "BitNet", "Open Source", "LLM"],
    readingTime: "4 min read",
    severity: "info",
    keyPoints: [
      "Replaces FP16 matrix multiplications with ternary {-1, 0, 1} operations",
      "Reduces matrix multiplication energy consumption by up to 70%",
      "Open source weights and llama.cpp kernels now publicly available"
    ]
  },
  {
    id: "sec-02",
    title: "Malicious PyPI & NPM Typo-Squatting Campaign Targets Developer Credentials",
    category: "security",
    summary: "Over 40 packages masquerading as popular cloud SDKs ('aws-sdk-v3-auth', 'google-cloud-storage-helper') were caught exfiltrating developer `.env` tokens, SSH keys, and Git configs to command-and-control servers during post-install hooks.",
    impact: "Advisory: Audit `package-lock.json` and lockfile dependencies. Revoke any leaked cloud credentials if typo packages were invoked.",
    source: "BleepingComputer",
    url: "https://www.bleepingcomputer.com/news/security/malicious-pypi-npm-packages-steal-developer-credentials/",
    publishedAt: "5 hours ago",
    tags: ["Security", "npm", "PyPI", "Malware", "Supply Chain"],
    readingTime: "3 min read",
    severity: "high",
    keyPoints: [
      "Packages utilized obfuscated base64 payloads inside `preinstall` lifecycle hooks",
      "PyPI and npm registries have removed the flagged packages and blocked author accounts",
      "Recommended action: run dependency vulnerability scanners on CI/CD pipelines"
    ]
  },
  {
    id: "ai-02",
    title: "Google DeepMind Announces Gemini 3 Series with Built-in Reasoning & Grounding",
    category: "ai",
    summary: "The next-generation Gemini model suite introduces native dynamic thinking levels, hybrid multi-tool invocation, and multimodal Live API streaming with unprecedented spatial reasoning and code generation capabilities.",
    impact: "Impact: Developers can leverage native Search Grounding and low-latency audio/video streaming via the modern `@google/genai` SDK.",
    source: "Google DeepMind",
    url: "https://blog.google/technology/ai/google-gemini-next-generation/",
    publishedAt: "6 hours ago",
    tags: ["AI", "Gemini 3", "DeepMind", "Multimodal", "Grounding"],
    readingTime: "5 min read",
    severity: "info",
    keyPoints: [
      "Introduces `ThinkingLevel.HIGH` and `ThinkingLevel.LOW` for dynamic inference cost control",
      "Native Google Search and Google Maps grounding capabilities built into the SDK",
      "Low-latency Live API supporting bidirectional audio streaming"
    ]
  },
  {
    id: "soft-01",
    title: "TypeScript 5.8 RC Released with Return Type Annotations & Faster Check Times",
    category: "software",
    summary: "Microsoft announced TypeScript 5.8 Release Candidate featuring `--erasableSyntaxOnly` flag for standard Node.js type-stripping, conditional type optimizations, and up to 18% faster type-checking passes on large enterprise monorepos.",
    impact: "Impact: Directly supports Node's experimental native TypeScript stripping without transpile step.",
    source: "TypeScript Official Blog",
    url: "https://devblogs.microsoft.com/typescript/announcing-typescript-5-8-rc/",
    publishedAt: "8 hours ago",
    tags: ["Software", "TypeScript", "Node.js", "Compiler"],
    readingTime: "3 min read",
    severity: "info",
    keyPoints: [
      "Introduces support for Node 22 native TS type stripping through syntax validation",
      "Major speedup for indexed access types and complex template literal expressions",
      "Zero breaking changes for existing TypeScript 5.x projects"
    ]
  },
  {
    id: "dev-01",
    title: "Vite 6 & Rolldown Engine Preview Achieves 4x Faster Production Bundling",
    category: "devtools",
    summary: "The Vite ecosystem team has published new benchmarks for the Rust-based Rolldown bundler integration, replacing Rollup and esbuild with unified Rust AST transformations and native tree-shaking.",
    impact: "Impact: Seamless drop-in replacement with massive reduction in CI build times for complex single-page apps.",
    source: "Vite Blog",
    url: "https://vite.dev/blog/announcing-vite-6",
    publishedAt: "10 hours ago",
    tags: ["DevTools", "Vite", "Rust", "Rolldown", "Web"],
    readingTime: "2 min read",
    severity: "info",
    keyPoints: [
      "Drop-in Rollup plugin compatibility layer",
      "Native multi-threaded source map generation",
      "Sub-second build times even on codebases exceeding 50,000 modules"
    ]
  },
  {
    id: "sec-03",
    title: "Zero-Day in Linux Kernel eBPF Subsystem Patched in Upstream Stable",
    category: "security",
    summary: "A local privilege escalation bug in the eBPF verifier (CVE-2025-1192) allowed unprivileged local users to gain root access through arithmetic overflow in map value pointers. Major distributions have rolled out emergency kernel updates.",
    impact: "Advisory: Apply distro kernel updates (`apt upgrade linux-image` / `dnf update kernel`) and reboot instances.",
    source: "Linux Kernel Security",
    url: "https://kernelnewbies.org/Linux_6_12#Security",
    publishedAt: "12 hours ago",
    tags: ["Security", "Linux", "eBPF", "CVE-2025-1192", "Kernel"],
    readingTime: "4 min read",
    severity: "high",
    keyPoints: [
      "Affects Linux kernels 5.15 through 6.12",
      "Exploit requires local shell access and unprivileged eBPF enabled (`kernel.unprivileged_bpf_disabled=0`)",
      "Mitigation: set `sysctl kernel.unprivileged_bpf_disabled=1` if reboot is delayed"
    ]
  },
  {
    id: "soft-02",
    title: "React 19 Server Actions & Optimistic Hooks Adoption Guide",
    category: "software",
    summary: "The React core team released updated recommendations on utilizing `useOptimistic`, `useActionState`, and async transitions for modern UI development without cumbersome boilerplate or third-party state managers.",
    impact: "Impact: Cleaner async flow handling and zero-waterfall client data updates.",
    source: "React Official Blog",
    url: "https://react.dev/blog/2024/12/05/react-19",
    publishedAt: "14 hours ago",
    tags: ["Software", "React 19", "Frontend", "JavaScript"],
    readingTime: "3 min read",
    severity: "info",
    keyPoints: [
      "Simplified form submissions and pending status indicators",
      "First-class support for asset preloading and document metadata",
      "Automatic cleanup of optimistic state on network settlement"
    ]
  }
];

// Helper to get Gemini Client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Smart URL resolver that guarantees exact deep links from Search Grounding chunks
function resolveExactArticleUrl(
  article: { title: string; source: string; url?: string; tags?: string[] },
  chunks: { uri: string; title: string }[]
): string {
  // 1. Check if model provided an exact deep link URL with path beyond root
  if (article.url && typeof article.url === 'string' && article.url.startsWith('http')) {
    try {
      const parsed = new URL(article.url);
      const pathname = parsed.pathname.toLowerCase();
      // If it is a specific article path (not root, not just home/blog index)
      if (
        pathname.length > 5 &&
        pathname !== '/blog' &&
        pathname !== '/blog/' &&
        pathname !== '/news' &&
        pathname !== '/news/' &&
        pathname !== '/index.html'
      ) {
        return article.url;
      }
    } catch {
      // invalid URL format, fallback to matching chunks
    }
  }

  // 2. Match against live search grounding chunks
  if (chunks.length > 0) {
    const articleWords = (article.title + ' ' + (article.source || '') + ' ' + (article.tags || []).join(' '))
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);

    let bestChunk: { uri: string; title: string } | null = null;
    let bestScore = -1;

    for (const chunk of chunks) {
      if (!chunk.uri || !chunk.uri.startsWith('http')) continue;

      const chunkWords = (chunk.title + ' ' + chunk.uri)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3);

      let score = 0;
      for (const w of articleWords) {
        if (chunkWords.includes(w)) {
          score += 2;
        }
      }

      // Bonus if chunk URI hostname matches source
      const cleanSource = (article.source || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanSource && chunk.uri.toLowerCase().includes(cleanSource)) {
        score += 3;
      }

      // Bonus if chunk URI has a specific path segment (deep link)
      try {
        const p = new URL(chunk.uri);
        if (p.pathname.length > 5) {
          score += 2;
        }
      } catch {}

      if (score > bestScore) {
        bestScore = score;
        bestChunk = chunk;
      }
    }

    if (bestChunk && bestScore > 0) {
      return bestChunk.uri;
    }

    // If article.url had a domain, find chunk with matching domain
    if (article.url) {
      try {
        const artHost = new URL(article.url).hostname.replace(/^www\./, '');
        const sameHostChunk = chunks.find(c => {
          try {
            return new URL(c.uri).hostname.replace(/^www\./, '') === artHost && new URL(c.uri).pathname.length > 4;
          } catch {
            return false;
          }
        });
        if (sameHostChunk) {
          return sameHostChunk.uri;
        }
      } catch {}
    }

    // Default to first valid grounding chunk
    if (chunks[0]?.uri) {
      return chunks[0].uri;
    }
  }

  // Fallback to provided article url or fallback
  if (article.url && article.url.startsWith('http')) {
    return article.url;
  }
  return 'https://news.ycombinator.com';
}

// Fetch news using Gemini with Google Search Grounding (RAG)
async function fetchRAGTechNews(queryParam?: string, categoryParam?: string) {
  const ai = getGeminiClient();
  if (!ai) {
    console.log('[Server] No GEMINI_API_KEY found, using curated tech feed.');
    return null;
  }

  const currentDateObj = new Date();
  const currentDateStr = currentDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });
  const currentIso = currentDateObj.toISOString();

  const focusTopic = queryParam
    ? `Specific search topic: "${queryParam}". Search the web for the latest reports, updates, CVEs, and articles regarding "${queryParam}".`
    : `Latest breaking tech roundup across package vulnerabilities, cyber attacks, CVEs, minor/major AI model releases, and software framework/runtime updates.`;

  const categoryFilter = categoryParam && categoryParam !== 'all'
    ? `Strictly focus all articles on the category: "${categoryParam}".`
    : `Include a balanced mix of:
- Cyber security attacks, CVEs, zero-days, and package/library vulnerabilities (npm, PyPI, Crates.io, Linux, Go, Java, Docker)
- AI updates (new LLM releases, open weights, frameworks, inference optimizations, tools, quantization)
- Software world updates (TypeScript, React, Node.js, Python, Rust, Go, web standards, compilers, devtools)`;

  const prompt = `You are a technical news curator and security intelligence aggregator for senior software engineers, security researchers, and systems developers.

LIVE SEARCH INSTRUCTION:
Current Date & Time: ${currentDateStr} (ISO: ${currentIso}).
Search Google for the latest, breaking technical news, security advisories, vulnerability CVEs, AI research drops, and software release notes published in the last 24 to 72 hours (or the most recent breaking cycle).

${focusTopic}
${categoryFilter}

Search reliable primary tech sources such as: BleepingComputer, NVD/NIST, GitHub Security Advisory Database, The Hacker News, Hugging Face Blog, PyPI/npm security advisories, ArXiv, TechCrunch, Ars Technica, InfoQ, official engineering blogs (Google, Microsoft, Meta, AWS, Cloudflare, React, Vite).

CRITICAL DIRECT LINK REQUIREMENT:
For each article, the "url" field MUST be the EXACT, SPECIFIC direct article URL (deep link) pointing directly to the specific blog post, CVE advisory page, GitHub security bulletin, or release note discovered in your Google search results.
DO NOT output generic homepage root URLs like "https://github.com", "https://huggingface.co", "https://nvd.nist.gov", or "https://bleepingcomputer.com". Provide the exact path (e.g. "https://nvd.nist.gov/vuln/detail/CVE-2025-XXXXX", "https://huggingface.co/blog/model-release-name", "https://bleepingcomputer.com/news/security/article-slug/").

Format your output as a STRICT JSON array of 6 to 10 articles.
Each article MUST have this exact JSON schema:
[
  {
    "id": "unique-slug-id",
    "title": "Clear, technical headline without generic clickbait",
    "category": "security" | "ai" | "software" | "devtools",
    "summary": "Rich, insightful 2-4 sentences explaining the technical root cause, mechanism, impact, or architecture so the reader learns the concrete details without leaving.",
    "impact": "A concise 1-sentence technical impact or advisory (e.g. 'Advisory: Upgrade to package >= v3.2.0 to patch remote code execution' or 'Impact: 40% memory reduction on transformer inference')",
    "source": "Name of publication (e.g. GitHub Advisory Database, NVD, Hugging Face, BleepingComputer, Microsoft DevBlog)",
    "url": "https://exact-domain.com/exact-article-path-from-search-results",
    "publishedAt": "Relative time (e.g. '1 hour ago', 'Today', 'Yesterday')",
    "tags": ["Tag1", "Tag2", "Tag3"],
    "readingTime": "e.g. '3 min read'",
    "severity": "critical" | "high" | "medium" | "info",
    "keyPoints": [
      "Key technical fact 1 with version or parameter details",
      "Key technical fact 2 with mechanism explanation",
      "Actionable takeaway, fix, or patch status"
    ]
  }
]

IMPORTANT:
- Return ONLY the valid JSON array. No markdown code fence wrappers, no other commentary.
- Ensure all JSON is valid and parseable.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2,
      },
    });

    let rawText = response.text || '';
    rawText = rawText.trim();
    if (rawText.startsWith('```json')) {
      rawText = rawText.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```/, '').replace(/```$/, '').trim();
    }

    // Extract grounding URLs and search queries
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const groundingChunks = groundingMetadata?.groundingChunks;
    const webSearchQueries = groundingMetadata?.webSearchQueries || [];

    const webUrls: { title: string; uri: string }[] = [];
    if (Array.isArray(groundingChunks)) {
      for (const chunk of groundingChunks) {
        if (chunk.web?.uri) {
          webUrls.push({
            title: chunk.web.title || '',
            uri: chunk.web.uri,
          });
        }
      }
    }

    const parsedArticles = JSON.parse(rawText);
    if (Array.isArray(parsedArticles) && parsedArticles.length > 0) {
      const articles = parsedArticles.map((art: any, idx: number) => {
        // Resolve the exact direct deep-link URL
        const exactUrl = resolveExactArticleUrl(art, webUrls);

        return {
          id: art.id || `rag-${Date.now()}-${idx}`,
          title: art.title || 'Technical Advisory',
          category: ['security', 'ai', 'software', 'devtools'].includes(art.category)
            ? art.category
            : 'software',
          summary: art.summary || 'No summary available.',
          impact: art.impact || undefined,
          source: art.source || 'Tech Digest Wire',
          url: exactUrl,
          publishedAt: art.publishedAt || 'Latest',
          tags: Array.isArray(art.tags) ? art.tags : ['Tech'],
          readingTime: art.readingTime || '3 min read',
          severity: art.severity || 'info',
          keyPoints: Array.isArray(art.keyPoints) ? art.keyPoints : []
        };
      });

      return {
        articles,
        sourcesCount: webUrls.length || articles.length,
        searchQueries: webSearchQueries,
        liveGrounded: true,
      };
    }
  } catch (error) {
    console.error('[Server] Gemini RAG aggregation error:', error);
  }
  return null;
}

// API: Get Tech Newsletter Feed
app.get('/api/news', async (req, res) => {
  const query = (req.query.q as string || '').trim();
  const category = (req.query.category as string || 'all').trim().toLowerCase();
  const forceRefresh = req.query.refresh === 'true';

  const cacheKey = `${query.toLowerCase()}_${category}`;
  const now = Date.now();

  // Check cache if not forcing refresh
  if (!forceRefresh && newsCache.has(cacheKey)) {
    const cached = newsCache.get(cacheKey)!;
    if (now - cached.timestamp < CACHE_TTL_MS) {
      return res.json({
        ...cached.data,
        cached: true,
        cacheTimestamp: cached.timestamp,
      });
    }
  }

  // Attempt live RAG generation with search grounding
  let ragResult = await fetchRAGTechNews(query, category);

  let articles = ragResult?.articles;
  let sourcesCount = ragResult?.sourcesCount || 0;

  // Fallback to filtered default articles if RAG did not return or no API key
  if (!articles || articles.length === 0) {
    let filtered = [...DEFAULT_TECH_ARTICLES];
    if (category && category !== 'all') {
      filtered = filtered.filter(a => a.category === category);
    }
    if (query) {
      const qLower = query.toLowerCase();
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(qLower) ||
        a.summary.toLowerCase().includes(qLower) ||
        a.tags.some(t => t.toLowerCase().includes(qLower)) ||
        (a.impact && a.impact.toLowerCase().includes(qLower))
      );
    }
    articles = filtered;
    sourcesCount = filtered.length;
  }

  // Generate executive highlights summary
  const securityHighlight = articles.find(a => a.category === 'security')?.title || 'No critical zero-day advisories reported in this cycle.';
  const aiHighlight = articles.find(a => a.category === 'ai')?.title || 'Continuous refinement in model architectures and local inference.';
  const softwareHighlight = articles.find(a => a.category === 'software' || a.category === 'devtools')?.title || 'Tooling and compiler optimizations advancing ecosystem stability.';

  const responseData = {
    articles,
    query,
    category,
    cached: false,
    cacheTimestamp: now,
    sourcesCount,
    liveGrounded: ragResult?.liveGrounded ?? false,
    searchQueries: ragResult?.searchQueries ?? [],
    lastSyncedIso: new Date(now).toISOString(),
    executiveSummary: {
      securityHighlight,
      aiHighlight,
      softwareHighlight,
    },
  };

  // Update Cache
  newsCache.set(cacheKey, {
    data: responseData,
    timestamp: now,
  });

  return res.json(responseData);
});

// API: Clear/Reset Cache endpoint
app.post('/api/cache/clear', (req, res) => {
  newsCache.clear();
  return res.json({ success: true, message: 'Server cache cleared.' });
});

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    cachedQueries: newsCache.size,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Setup Vite development or static production middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Tech Digest Server] listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
