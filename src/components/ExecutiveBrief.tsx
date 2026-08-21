import React from 'react';
import { ShieldAlert, Cpu, Code2, ChevronDown, ChevronUp, Radio } from 'lucide-react';
import { TechArticle } from '../types';

interface ExecutiveBriefProps {
  articles: TechArticle[];
  executiveSummary?: {
    securityHighlight: string;
    aiHighlight: string;
    softwareHighlight: string;
  };
  sourcesCount: number;
  liveGrounded?: boolean;
  searchQueries?: string[];
}

export const ExecutiveBrief: React.FC<ExecutiveBriefProps> = ({
  articles,
  executiveSummary,
  sourcesCount,
  liveGrounded,
  searchQueries,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  const securityCount = articles.filter(a => a.category === 'security').length;
  const aiCount = articles.filter(a => a.category === 'ai').length;
  const softCount = articles.filter(a => a.category === 'software' || a.category === 'devtools').length;

  return (
    <div className="bg-[#EFEFE7] border border-[#E0E0D0] mb-0 text-xs">
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
            <Radio className={`w-3 h-3 ${liveGrounded ? 'text-green-600 animate-pulse' : 'text-gray-400'}`} />
            Threat & Innovation Radar
          </span>
          <span className="text-gray-500 text-[10px]">
            ({articles.length} signals aggregated across {sourcesCount || articles.length} sources)
          </span>
          {liveGrounded && (
            <span className="bg-green-100 text-green-800 text-[9px] font-bold uppercase px-1.5 py-0.2 border border-green-300">
              Live Web Grounded
            </span>
          )}
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-600 hover:text-black uppercase text-[10px] font-bold flex items-center gap-1 cursor-pointer"
        >
          <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 bg-white border-t border-[#E0E0D0] space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Security Box */}
            <div className="border border-[#E0E0D0] p-3 bg-[#FAFAFA]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-red-600 uppercase">
                  Vulnerabilities ({securityCount})
                </span>
                <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                {executiveSummary?.securityHighlight || 'Package dependency audits and zero-day patches.'}
              </p>
            </div>

            {/* AI Box */}
            <div className="border border-[#E0E0D0] p-3 bg-[#FAFAFA]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-blue-600 uppercase">
                  AI / ML Updates ({aiCount})
                </span>
                <Cpu className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                {executiveSummary?.aiHighlight || 'Quantization breakthroughs and live multimodal APIs.'}
              </p>
            </div>

            {/* Software Box */}
            <div className="border border-[#E0E0D0] p-3 bg-[#FAFAFA]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-green-600 uppercase">
                  Software & Tools ({softCount})
                </span>
                <Code2 className="w-3.5 h-3.5 text-green-600" />
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                {executiveSummary?.softwareHighlight || 'Tooling updates, compiler features, and framework enhancements.'}
              </p>
            </div>
          </div>

          {/* Search Queries tag pill bar if available */}
          {searchQueries && searchQueries.length > 0 && (
            <div className="pt-1 flex items-center gap-1.5 flex-wrap text-[10px] text-gray-500">
              <span className="font-bold uppercase text-gray-600">RAG Grounding Queries:</span>
              {searchQueries.slice(0, 4).map((sq, sIdx) => (
                <span key={sIdx} className="bg-[#F6F6EF] border border-[#E0E0D0] px-1.5 py-0.5 font-mono text-gray-700">
                  {sq}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
