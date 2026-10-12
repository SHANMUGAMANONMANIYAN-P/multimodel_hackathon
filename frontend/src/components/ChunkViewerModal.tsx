import React, { useEffect, useState } from 'react';
import { X, FileText, Presentation, Video, Layers, Tag, Loader2 } from 'lucide-react';
import { Material, ExtractedChunk } from '../types';
import { api } from '../services/api';

interface ChunkViewerModalProps {
  material: Material | null;
  onClose: () => void;
}

export const ChunkViewerModal: React.FC<ChunkViewerModalProps> = ({ material, onClose }) => {
  const [chunks, setChunks] = useState<ExtractedChunk[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterTopic, setFilterTopic] = useState<string>('all');

  useEffect(() => {
    if (!material) return;
    const fetchChunks = async () => {
      setLoading(true);
      try {
        const data = await api.materials.getChunks(material.id);
        setChunks(data);
      } catch (err) {
        console.error('Failed to load chunks:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchChunks();
  }, [material]);

  if (!material) return null;

  const filteredChunks = filterTopic === 'all'
    ? chunks
    : chunks.filter(c => c.topic_tags.includes(filterTopic));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wider bg-brand-50 text-brand-700 border border-brand-200">
                {material.file_type}
              </span>
              <span className="text-xs text-slate-500">
                {material.total_pages_or_slides} {material.file_type === 'pdf' ? 'pages' : material.file_type === 'pptx' ? 'slides' : 'units'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-navy-900 mt-0.5">
              Extracted Chunks: {material.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center space-x-3 text-xs">
          <span className="font-semibold text-slate-600 flex items-center space-x-1">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter Topic:</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilterTopic('all')}
              className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                filterTopic === 'all'
                  ? 'bg-navy-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Chunks ({chunks.length})
            </button>
            {material.detected_topics.map((t) => (
              <button
                key={t}
                onClick={() => setFilterTopic(t)}
                className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                  filterTopic === t
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Chunks List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400 space-x-2">
              <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
              <span className="text-sm font-medium">Retrieving extracted chunks...</span>
            </div>
          ) : filteredChunks.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No chunks found matching selected filter.
            </div>
          ) : (
            filteredChunks.map((chunk, i) => (
              <div
                key={chunk.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-semibold px-2 py-0.5 rounded bg-slate-200/60 text-slate-700">
                      Chunk #{chunk.chunk_index + 1}
                    </span>
                    <span className="font-medium text-slate-500">
                      {chunk.source_type === 'pdf' && `Page ${chunk.page_number}`}
                      {chunk.source_type === 'pptx' && `Slide ${chunk.slide_number}`}
                      {chunk.source_type === 'video' && `Time ${chunk.video_timestamp}`}
                    </span>
                  </div>
                  {chunk.figure_description && (
                    <span className="text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded text-[11px] font-medium">
                      Diagram / Visual Element
                    </span>
                  )}
                </div>

                <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line font-sans">
                  {chunk.content}
                </p>

                {chunk.topic_tags.length > 0 && (
                  <div className="flex items-center space-x-1.5 pt-1">
                    {chunk.topic_tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
          <span>
            Indexed and vector-embedded for semantic retrieval & grounded citation verification.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
