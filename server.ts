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
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache

// Default high-grade fallback curated tech articles
const DEFAULT_TECH_ARTICLES = [
  {
    id: "sec-01",
    title: "Critical RCE Vulnerability in Popular Open-Source Logging Utility",
    category: "security",
    summary: "Security researchers disclosed a high-severity remote code execution flaw in an ecosystem dependency widely used across Node.js and Python microservices. Attackers could execute arbitrary commands through unsanitized header serialization parameters during stream ingestion.",
    impact: "Advisory: Patch upgrade available immediately. Upgrade to >= v3.4.2 or disable unauthenticated log ingestion pipelines.",
    source: "NVD & GitHub Advisory Database",
    url: "https://nvd.nist.gov",
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
    source: "Hugging Face & ArXiv",
    url: "https://huggingface.co/blog",
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
    url: "https://www.bleepingcomputer.com",
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
    source: "Google DeepMind Blog",
    url: "https://blog.google/technology/ai",
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
    url: "https://devblogs.microsoft.com/typescript",
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
    source: "Vite Core Team",
    url: "https://vitejs.dev",
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
    url: "https://kernel.org",
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
    source: "React Blog",
    url: "https://react.dev/blog",
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

// Fetch news using Gemini with Google Search Grounding (RAG)
async function fetchRAGTechNews(queryParam?: string, categoryParam?: string) {
  const ai = getGeminiClient();
  if (!ai) {
    console.log('[Server] No GEMINI_API_KEY found, using curated tech feed.');
    return null;
  }

  const focusTopic = queryParam
    ? `Specific search topic: "${queryParam}".`
    : `General latest tech roundup across package security/CVEs, minor/major AI developments, and software frameworks.`;

  const categoryFilter = categoryParam && categoryParam !== 'all'
    ? `Strictly focus articles on category: "${categoryParam}".`
    : `Include a balanced mix of:
- Cyber security attacks, CVEs, package/library vulnerabilities (npm, PyPI, Crates, Linux, Go, Java, zero-days)
- AI updates (new models, open weights, frameworks, minor releases, tool announcements)
- Software world updates (TypeScript, React, Python, Rust, Go, web standards, architecture, devtools)`;

  const prompt = `You are a premier technical news aggregator and newsletter curator for senior software engineers, security researchers, and developers.

Search the live web for the latest real tech news, vulnerabilities, software releases, and AI updates.
${focusTopic}
${categoryFilter}

Current local time context: ${new Date().toISOString()}.

Search for recent news from reliable tech sources (e.g. BleepingComputer, Hacker News, GitHub Advisories, NVD, Hugging Face, arXiv, PyPI, TechCrunch, Arstechnica, InfoQ, official engineering blogs).

Format your output as a STRICT JSON array of 6 to 10 articles.
Each article MUST have this exact JSON format:
[
  {
    "id": "unique-id-string",
    "title": "Clear, informative headline without clickbait",
    "category": "security" | "ai" | "software" | "devtools",
    "summary": "Rich, insightful 2-4 sentences explaining the core technical details, mechanism, context, or implications so a reader gets real depth without clicking away.",
    "impact": "A concise 1-sentence technical impact or advisory (e.g. 'Advisory: Upgrade to >= v2.1.0' or 'Impact: 3x throughput improvement for streaming workloads')",
    "source": "Name of source or publication (e.g. GitHub Security Advisory, PyPI, Hugging Face, The Verge, BleepingComputer)",
    "url": "Actual source URL from search results or relevant direct domain",
    "publishedAt": "Relative time (e.g. '1 hour ago', 'Today', 'Yesterday')",
    "tags": ["Tag1", "Tag2", "Tag3"],
    "readingTime": "e.g. '3 min read'",
    "severity": "critical" | "high" | "medium" | "info",
    "keyPoints": [
      "Key technical fact 1",
      "Key technical fact 2",
      "Actionable takeaway or patch info"
    ]
  }
]

IMPORTANT:
- Return ONLY the valid JSON array. No markdown code fence wrappers, no other commentary.
- Ensure all JSON is well-formed.
- If specific query yields specific niche items, tailor all articles accordingly.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.3,
      },
    });

    let rawText = response.text || '';
    // Strip markdown code block markers if present
    rawText = rawText.trim();
    if (rawText.startsWith('```json')) {
      rawText = rawText.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```/, '').replace(/```$/, '').trim();
    }

    // Extract grounding URLs if available to enhance URLs
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const webUrls: { title?: string; uri?: string }[] = [];
    if (Array.isArray(groundingChunks)) {
      for (const chunk of groundingChunks) {
        if (chunk.web?.uri) {
          webUrls.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      }
    }

    const parsedArticles = JSON.parse(rawText);
    if (Array.isArray(parsedArticles) && parsedArticles.length > 0) {
      // Clean and inject grounding URLs where helpful
      const articles = parsedArticles.map((art: any, idx: number) => {
        let finalUrl = art.url;
        if (!finalUrl || finalUrl === '#' || !finalUrl.startsWith('http')) {
          if (webUrls[idx]?.uri) {
            finalUrl = webUrls[idx].uri;
          } else {
            finalUrl = 'https://news.ycombinator.com';
          }
        }
        return {
          id: art.id || `rag-${Date.now()}-${idx}`,
          title: art.title || 'Technical Advisory',
          category: ['security', 'ai', 'software', 'devtools'].includes(art.category)
            ? art.category
            : 'software',
          summary: art.summary || 'No summary available.',
          impact: art.impact || undefined,
          source: art.source || 'Tech Digest Feed',
          url: finalUrl,
          publishedAt: art.publishedAt || 'Just now',
          tags: Array.isArray(art.tags) ? art.tags : ['Tech'],
          readingTime: art.readingTime || '3 min read',
          severity: art.severity || 'info',
          keyPoints: Array.isArray(art.keyPoints) ? art.keyPoints : []
        };
      });

      return {
        articles,
        sourcesCount: webUrls.length || articles.length,
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
