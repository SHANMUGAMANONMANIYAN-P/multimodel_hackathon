import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  Presentation,
  Video,
  BookOpen,
  Search,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Layers
} from 'lucide-react';
import { Material } from '../types';
import { api } from '../services/api';
import { ChunkViewerModal } from '../components/ChunkViewerModal';

export const MaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState<string>('');

  const fetchMaterials = async () => {
    try {
      const data = await api.materials.list();
      setMaterials(data);
    } catch (err) {
      console.error('Error fetching materials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
    const interval = setInterval(fetchMaterials, 5000); // Polling for processing status
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setCustomTitle(e.target.files[0].name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
      setUploadError(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setUploadError(null);
    try {
      await api.materials.upload(selectedFile, customTitle);
      setSelectedFile(null);
      setCustomTitle('');
      await fetchMaterials();
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this study material and all its indexed chunks?')) return;
    try {
      await api.materials.delete(id);
      setMaterials(materials.filter((m) => m.id !== id));
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
    }
  };

  const filteredMaterials = materials.filter((m) =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.detected_topics.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getFormatIcon = (type: string) => {
    switch (type) {
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

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-950 tracking-tight">
            Learning Materials Library
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ingest multimodal textbooks, lecture slides, and video transcripts into your source-cited knowledge base.
          </p>
        </div>
      </div>

      {/* Upload Dropzone Card */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-navy-900 flex items-center space-x-2">
          <UploadCloud className="w-5 h-5 text-brand-600" />
          <span>Upload Multimodal Course Media</span>
        </h2>

        {uploadError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-2xl p-6 text-center transition-colors bg-slate-50/50">
            <input
              type="file"
              id="file-upload"
              accept=".pdf,.pptx,.ppt,.txt,.md,.srt,.vtt,.mp4"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="file-upload" className="cursor-pointer space-y-2 block">
              <div className="w-12 h-12 mx-auto rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-navy-900">
                {selectedFile ? selectedFile.name : 'Click to select or drop files here'}
              </div>
              <p className="text-xs text-slate-500">
                Supported formats: PDF textbooks, PPTX slides, SRT/VTT/MP4 transcripts, Markdown, and TXT
              </p>
            </label>
          </div>

          {selectedFile && (
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Custom title for this material..."
                className="flex-1 w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                disabled={uploading}
                className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing & Indexing...</span>
                  </>
                ) : (
                  <span>Upload & Ingest</span>
                )}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Materials List & Search */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-base font-bold text-navy-900">
            Ingested Course Documents ({materials.length})
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search materials or topics..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
            <span>Loading materials repository...</span>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs space-y-2">
            <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-600">No study materials found</p>
            <p>Upload a course PDF or slide deck above to initialize indexing.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMaterials.map((mat) => (
              <div
                key={mat.id}
                onClick={() => setSelectedMaterial(mat)}
                className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                        {getFormatIcon(mat.file_type)}
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          {mat.file_type} • {mat.total_pages_or_slides}{' '}
                          {mat.file_type === 'pdf' ? 'pages' : mat.file_type === 'pptx' ? 'slides' : 'segments'}
                        </span>
                        <h3 className="text-sm font-bold text-navy-950 line-clamp-1 group-hover:text-brand-600 transition-colors">
                          {mat.title}
                        </h3>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(mat.id, e)}
                      title="Delete material"
                      className="p-1.5 text-slate-300 hover:text-red-600 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {mat.summary || 'Course study material indexed for grounded RAG and adaptive questions.'}
                  </p>

                  {/* Topic tags */}
                  {mat.detected_topics && mat.detected_topics.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {mat.detected_topics.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"
                        >
                          #{tag}
                        </span>
                      ))}
                      {mat.detected_topics.length > 3 && (
                        <span className="text-[10px] text-slate-400">
                          +{mat.detected_topics.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer status and inspect chunk button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5">
                    {mat.status === 'completed' ? (
                      <span className="flex items-center space-x-1 text-emerald-600 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{mat.chunk_count} Chunks Indexed</span>
                      </span>
                    ) : mat.status === 'processing' ? (
                      <span className="flex items-center space-x-1 text-brand-600 font-semibold text-[11px]">
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                        <span>Processing Chunks...</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-red-600 font-semibold text-[11px]">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Processing Failed</span>
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-bold text-brand-600 flex items-center space-x-1 group-hover:underline">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chunk Viewer Modal */}
      {selectedMaterial && (
        <ChunkViewerModal
          material={selectedMaterial}
          onClose={() => setSelectedMaterial(null)}
        />
      )}
    </div>
  );
};
