import {
  User,
  Material,
  ExtractedChunk,
  ChatMessage,
  ChatConversation,
  Assessment,
  AssessmentResult,
  DashboardStats,
  KnowledgeMapData,
  EvaluationRun
} from '../types';

const API_BASE = '/api/v1';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('eduadapt_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'Request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      errorDetail = `HTTP ${response.status} ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Auth
  auth: {
    login: async (email: string, password: string): Promise<{ access_token: string; user: User }> => {
      return request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    },
    register: async (email: string, password: string, full_name?: string): Promise<{ access_token: string; user: User }> => {
      return request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, full_name }),
      });
    },
    getMe: async (): Promise<User> => {
      return request('/auth/me');
    },
  },

  // Materials
  materials: {
    list: async (): Promise<Material[]> => {
      return request('/materials/');
    },
    get: async (id: string): Promise<Material> => {
      return request(`/materials/${id}`);
    },
    getChunks: async (id: string): Promise<ExtractedChunk[]> => {
      return request(`/materials/${id}/chunks`);
    },
    delete: async (id: string): Promise<{ message: string }> => {
      return request(`/materials/${id}`, { method: 'DELETE' });
    },
    upload: async (file: File, title?: string): Promise<Material> => {
      const formData = new FormData();
      formData.append('file', file);
      if (title) formData.append('title', title);

      const token = localStorage.getItem('eduadapt_token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch(`${API_BASE}/materials/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Upload failed');
      }
      return response.json();
    },
  },

  // Tutor
  tutor: {
    chat: async (content: string, material_id?: string, allow_external = false, conversation_id?: string): Promise<ChatMessage> => {
      return request('/tutor/chat', {
        method: 'POST',
        body: JSON.stringify({
          content,
          material_id: material_id || undefined,
          allow_external_knowledge: allow_external,
        }),
      });
    },
    getConversations: async (): Promise<ChatConversation[]> => {
      return request('/tutor/conversations');
    },
    getConversation: async (id: string): Promise<ChatConversation> => {
      return request(`/tutor/conversations/${id}`);
    },
  },

  // Assessments
  assessments: {
    generate: async (params: {
      material_id?: string;
      topic_name?: string;
      difficulty?: string;
      question_count?: number;
      time_limit_minutes?: number;
    }): Promise<Assessment> => {
      return request('/assessments/generate', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
    get: async (id: string): Promise<Assessment> => {
      return request(`/assessments/${id}`);
    },
    submit: async (
      id: string,
      answers: Array<{ question_id: string; student_response: string }>,
      time_spent_seconds: number
    ): Promise<AssessmentResult> => {
      return request(`/assessments/${id}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          time_spent_seconds,
          answers,
        }),
      });
    },
    getRecentAttempts: async (): Promise<any[]> => {
      return request('/assessments/attempts/recent');
    },
  },

  // Analytics & Mastery
  analytics: {
    getDashboard: async (): Promise<DashboardStats> => {
      return request('/analytics/dashboard');
    },
    getKnowledgeMap: async (): Promise<KnowledgeMapData> => {
      return request('/analytics/knowledge-map');
    },
    getMasteryHistory: async (): Promise<any[]> => {
      return request('/analytics/mastery/history');
    },
  },

  // Evaluation & Benchmark
  evaluation: {
    getRuns: async (): Promise<{ status: string; runs: EvaluationRun[] }> => {
      return request('/evaluation/runs');
    },
    runBenchmark: async (dataset_name = 'Standard Multimodal Test Set'): Promise<EvaluationRun> => {
      return request('/evaluation/run', {
        method: 'POST',
        body: JSON.stringify({ dataset_name, simulate_learners: true }),
      });
    },
    getRun: async (id: string): Promise<EvaluationRun> => {
      return request(`/evaluation/runs/${id}`);
    },
  },
};
