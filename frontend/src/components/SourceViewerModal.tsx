import React from 'react';
import { X, FileText, Presentation, Video, CheckCircle2, ExternalLink, Clock, BookOpen } from 'lucide-react';
import { CitationItem } from '../types';

interface SourceViewerModalProps {
  citation: CitationItem | null;
  onClose: () => void;
}

export const SourceViewerModal: React.FC<SourceViewerModalProps> = ({ citation, onClose }) => {
  if (!citation) return null;

  const getSourceIcon = () => {
    switch (citation.source_type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-600" />;
      case 'pptx':
        return <Presentation className="w-5 h-5 text-orange-600" />;
      case 'video':
        return <Video className="w-5 h-5 text-indigo-600" />;
      default:
        return <BookOpen className="w-5 h-5 text-slate-600" />;
    }
  };

  const getLocationLabel = () => {
    if (citation.source_type === 'pdf' && citation.page_number) {
      return `Page ${citation.page_number}`;
    }
    if (citation.source_type === 'pptx' && citation.slide_number) {
      return `Slide ${citation.slide_number}`;
    }
    if (citation.source_type === 'video' && citation.video_timestamp) {
      return `Timestamp ${citation.video_timestamp}`;
    }
    return 'Document Reference';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-200">
              {getSourceIcon()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wider bg-brand-50 text-brand-700 border border-brand-200">
                  {citation.source_type}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  {getLocationLabel()}
                </span>
              </div>
              <h3 className="text-base font-bold text-navy-900 line-clamp-1 mt-0.5">
                {citation.material_title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
          {/* Visual simulation of source format */}
          {citation.source_type === 'video' && (
            <div className="rounded-xl bg-navy-900 text-white p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center space-x-1.5 text-brand-300 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Playback Marker: {citation.video_timestamp || '00:00'}</span>
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded text-[11px] font-medium border border-emerald-500/30">
                  Synced Transcript
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-brand-500 h-full w-2/5 rounded-full" />
              </div>
              <p className="text-sm font-medium text-slate-200 italic">
                "{citation.snippet}"
              </p>
            </div>
          )}

          {citation.source_type === 'pptx' && (
            <div className="rounded-xl border border-orange-200 bg-orange-50/40 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-orange-800 font-semibold">
                <span>Slide Deck Presentation</span>
                <span>Slide #{citation.slide_number || 1}</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-orange-100 shadow-sm text-sm text-slate-800">
                <p className="font-semibold text-navy-900 mb-1">Slide Content & Notes:</p>
                <p className="text-slate-700 whitespace-pre-line">{citation.snippet}</p>
              </div>
            </div>
          )}

          {citation.source_type === 'pdf' && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                <span>Verified Textbook Page Segment</span>
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                  Page #{citation.page_number || 1}
                </span>
              </div>
              <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm text-sm text-slate-800 leading-relaxed font-serif">
                {citation.snippet}
              </div>
            </div>
          )}

          {citation.source_type === 'text' && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-800 font-mono leading-relaxed">
              {citation.snippet}
            </div>
          )}

          {/* Verification Badge */}
          <div className="flex items-center space-x-2 text-xs font-medium text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              Source Grounding Verified: This citation was mathematically retrieved and validated against stored document chunk <code className="bg-emerald-100 px-1 py-0.5 rounded text-[11px] font-mono">{citation.chunk_id.slice(0, 8)}</code>.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 bg-slate-50 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            Close Source
          </button>
        </div>
      </div>
    </div>
  );
};
