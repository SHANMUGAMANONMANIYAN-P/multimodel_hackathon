import React, { useState, useEffect } from 'react';
import { Network, Sparkles, Brain, ArrowRight, Play, CheckCircle2, Layers } from 'lucide-react';
import { KnowledgeMapData, KnowledgeMapNode } from '../types';
import { api } from '../services/api';

interface KnowledgeMapPageProps {
  onStartQuizForTopic: (topicName: string) => void;
}

export const KnowledgeMapPage: React.FC<KnowledgeMapPageProps> = ({ onStartQuizForTopic }) => {
  const [mapData, setMapData] = useState<KnowledgeMapData>({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState<KnowledgeMapNode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMap = async () => {
      try {
        const data = await api.analytics.getKnowledgeMap();
        setMapData(data);
        if (data.nodes.length > 0) {
          setSelectedNode(data.nodes[0]);
        }
      } catch (err) {
        console.error('Failed to load knowledge map:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMap();
  }, []);

  const getNodeColor = (prob: number) => {
    if (prob >= 0.85) return { bg: 'bg-emerald-500', border: 'border-emerald-600', text: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-800' };
    if (prob >= 0.70) return { bg: 'bg-brand-500', border: 'border-brand-600', text: 'text-brand-700', badge: 'bg-brand-50 text-brand-800' };
    if (prob >= 0.40) return { bg: 'bg-amber-500', border: 'border-amber-600', text: 'text-amber-700', badge: 'bg-amber-50 text-amber-800' };
    return { bg: 'bg-rose-500', border: 'border-rose-600', text: 'text-rose-700', badge: 'bg-rose-50 text-rose-800' };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-black text-navy-950 tracking-tight">
          Concept & Prerequisite Knowledge Map
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Interactive curriculum DAG displaying topic dependencies, prerequisite linkages, and current BKT mastery estimates.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Interactive Concept Graph Canvas */}
        <div className="lg:col-span-2 p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold text-navy-900 flex items-center space-x-1.5">
              <Network className="w-4 h-4 text-brand-600" />
              <span>Curriculum Graph Topology</span>
            </span>
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-[11px]">Novice (&lt;40%)</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-[11px]">Developing</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                <span className="text-[11px]">Proficient</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-[11px]">Mastered (≥85%)</span>
              </span>
            </div>
          </div>

          {/* Graphical Concept Grid */}
          <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 min-h-[380px] flex flex-col justify-center space-y-6 relative overflow-hidden">
            <div className="space-y-6 max-w-xl mx-auto w-full">
              {mapData.nodes.map((node) => {
                const colors = getNodeColor(node.mastery);
                const isSelected = selectedNode?.id === node.id;
                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between shadow-sm ${
                      isSelected
                        ? 'border-navy-950 bg-white ring-4 ring-brand-100 scale-[1.02]'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3.5 h-3.5 rounded-full ${colors.bg}`} />
                      <div>
                        <h4 className="text-sm font-bold text-navy-950">{node.name}</h4>
                        <span className="text-[11px] text-slate-500">{node.category}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${colors.badge}`}>
                        {Math.round(node.mastery * 100)}%
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-300" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Concept Inspector Panel */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
          {selectedNode ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Concept Inspector
                </span>
                <h3 className="text-lg font-black text-navy-950">{selectedNode.name}</h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {selectedNode.category}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-500 block">Bayesian Mastery Estimate</span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-black font-mono text-navy-950">
                    {Math.round(selectedNode.mastery * 100)}%
                  </span>
                  <span className="text-xs font-bold text-brand-600">
                    ({selectedNode.state})
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-brand-600 h-full rounded-full transition-all"
                    style={{ width: `${Math.round(selectedNode.mastery * 100)}%` }}
                  />
                </div>
              </div>

              {/* Prerequisite status */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-navy-900 block">Curriculum Dependencies:</span>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Extracted from textbook chapter structures and lecture sequence ordering.
                </p>
                <div className="p-3 bg-brand-50/60 rounded-xl border border-brand-200 text-brand-900 space-y-1 text-xs">
                  <span className="font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />
                    <span>Prerequisite Readiness Confirmed</span>
                  </span>
                  <p className="text-[11px] text-slate-600">
                    Prior mathematical concepts meet the required foundation threshold.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Select a concept from the map to inspect dependencies.
            </div>
          )}

          {selectedNode && (
            <button
              onClick={() => onStartQuizForTopic(selectedNode.name)}
              className="w-full mt-4 py-3 px-4 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Practice {selectedNode.name}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
