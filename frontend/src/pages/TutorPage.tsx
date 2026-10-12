import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  BookOpen,
  FileText,
  Presentation,
  Video,
  AlertCircle,
  ExternalLink,
  Loader2,
  CheckCircle2,
  HelpCircle,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { ChatMessage, CitationItem, Material } from '../types';
import { api } from '../services/api';
import { SourceViewerModal } from '../components/SourceViewerModal';

export const TutorPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [allowExternalKnowledge, setAllowExternalKnowledge] = useState<boolean>(false);
  const [selectedCitation, setSelectedCitation] = useState<CitationItem | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMaterialsAndHistory = async () => {
      try {
        const mats = await api.materials.list();
        setMaterials(mats);

        const convs = await api.tutor.getConversations();
        if (convs.length > 0 && convs[0].messages.length > 0) {
          setMessages(convs[0].messages);
        } else {
          // Starter greeting message
          setMessages([
            {
              id: 'init_welcome',
              conversation_id: 'welcome',
              sender: 'assistant',
              content:
                "Hello! I am your **EduAdapt AI Study Companion**.\n\nAsk me any concept, equation, or theorem from your uploaded lecture notes, textbooks, or slides. Every factual answer will be strictly cited to your course materials with clickable page and slide markers.\n\nTry clicking one of the suggested questions below!",
              refusal_flag: false,
              citations: [],
              created_at: new Date().toISOString(),
            },
          ]);
        }
      } catch (err) {
        console.error('Failed to load tutor data:', err);
      }
    };
    fetchMaterialsAndHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      conversation_id: 'active',
      sender: 'user',
      content: query,
      refusal_flag: false,
      citations: [],
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');
    setLoading(true);

    try {
      const response = await api.tutor.chat(
        query,
        selectedMaterialId || undefined,
        allowExternalKnowledge
      );
      setMessages((prev) => [...prev, response]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          conversation_id: 'active',
          sender: 'assistant',
          content: `Tutor communication error: ${err.message}`,
          refusal_flag: true,
          citations: [],
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    'How does the Hessian matrix condition number affect gradient descent convergence?',
    'Why is reverse-mode automatic differentiation faster than forward-mode in deep learning?',
    'What is the formula and intuition behind Scaled Dot-Product Attention in Transformers?',
    'What are the superconductivity vortex lines of liquid helium-4 superfluid?', // Known unanswerable refusal test!
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] max-w-5xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-200">
      {/* Top Options Bar */}
      <div className="flex flex-wrap items-center justify-between px-6 py-3.5 bg-slate-50 border-b border-slate-200 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-brand-50 text-brand-600 border border-brand-200">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-navy-900">Source-Grounded AI Tutor</h2>
            <p className="text-[11px] text-slate-500">Hallucination-resistant RAG with strict verification</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          {/* Material Selector Filter */}
          <select
            value={selectedMaterialId}
            onChange={(e) => setSelectedMaterialId(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Uploaded Course Materials</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title} ({m.file_type.toUpperCase()})
              </option>
            ))}
          </select>

          {/* External Knowledge Toggle */}
          <label className="flex items-center space-x-1.5 cursor-pointer text-slate-600 select-none">
            <input
              type="checkbox"
              checked={allowExternalKnowledge}
              onChange={(e) => setAllowExternalKnowledge(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500 w-3.5 h-3.5"
            />
            <span className="text-[11px] font-medium">Allow External Knowledge</span>
          </label>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-2xl rounded-2xl p-4 sm:p-5 text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-navy-950 text-white rounded-br-none shadow-sm'
                  : 'bg-slate-50 border border-slate-200 text-slate-900 rounded-bl-none shadow-sm'
              }`}
            >
              {/* Refusal Banner */}
              {msg.refusal_flag && (
                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Source Verification Notice</span>
                    <span>No matching evidence was found in your uploaded materials for this query. The tutor refused to invent facts.</span>
                  </div>
                </div>
              )}

              {/* Message Content */}
              <div className="whitespace-pre-line font-sans space-y-2">
                {msg.content}
              </div>

              {/* Clickable Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-2">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Clickable Source Citations:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {msg.citations.map((cit, idx) => {
                      const loc =
                        cit.source_type === 'pdf'
                          ? `Page ${cit.page_number}`
                          : cit.source_type === 'pptx'
                          ? `Slide ${cit.slide_number}`
                          : cit.source_type === 'video'
                          ? `Video ${cit.video_timestamp}`
                          : 'Doc Section';

                      return (
                        <button
                          key={cit.chunk_id || idx}
                          onClick={() => setSelectedCitation(cit)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-white border border-brand-200 text-brand-700 hover:bg-brand-50 hover:border-brand-400 shadow-sm transition-all"
                        >
                          {cit.source_type === 'pdf' && <FileText className="w-3.5 h-3.5 text-red-500" />}
                          {cit.source_type === 'pptx' && <Presentation className="w-3.5 h-3.5 text-orange-500" />}
                          {cit.source_type === 'video' && <Video className="w-3.5 h-3.5 text-indigo-500" />}
                          <span>{cit.material_title.slice(0, 18)}... [{loc}]</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 px-1">
              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-3 text-slate-400 text-xs py-2">
            <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
            <span>Consulting source chunks & verifying citations...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Starter Questions */}
      <div className="px-6 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center space-x-2 overflow-x-auto text-xs">
        <span className="font-bold text-slate-500 whitespace-nowrap">Suggested:</span>
        {sampleQuestions.map((sq, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(sq)}
            className="whitespace-nowrap px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-brand-300 hover:bg-brand-50/50 transition-colors text-[11px]"
          >
            {sq.slice(0, 48)}...
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-3"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask a question about your uploaded course materials..."
            className="flex-1 px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || loading}
            className="p-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Modal for inspect citation */}
      {selectedCitation && (
        <SourceViewerModal
          citation={selectedCitation}
          onClose={() => setSelectedCitation(null)}
        />
      )}
    </div>
  );
};
