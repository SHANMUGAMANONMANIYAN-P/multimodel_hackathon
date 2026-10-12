export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface CitationItem {
  chunk_id: string;
  material_id: string;
  material_title: string;
  source_type: 'pdf' | 'pptx' | 'text' | 'video';
  page_number?: number;
  slide_number?: number;
  video_timestamp?: string;
  snippet: string;
}

export interface ExtractedChunk {
  id: string;
  material_id: string;
  chunk_index: number;
  content: string;
  source_type: 'pdf' | 'pptx' | 'text' | 'video';
  page_number?: number;
  slide_number?: number;
  video_timestamp?: string;
  topic_tags: string[];
  figure_description?: string;
}

export interface Material {
  id: string;
  title: string;
  original_filename: string;
  file_type: 'pdf' | 'pptx' | 'text' | 'video';
  file_size: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  summary?: string;
  detected_topics: string[];
  total_pages_or_slides: number;
  created_at: string;
  chunk_count: number;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender: 'user' | 'assistant';
  content: string;
  refusal_flag: boolean;
  citations: CitationItem[];
  created_at: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  material_id?: string;
  topic_id?: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
}

export interface Question {
  id: string;
  question_text: string;
  question_type: 'mcq' | 'short_answer' | 'numerical';
  topic_name: string;
  difficulty: string;
  options: string[];
  fingerprint: string;
  source_references: CitationItem[];
}

export interface Assessment {
  id: string;
  title: string;
  difficulty: string;
  question_count: number;
  time_limit_minutes: number;
  status: string;
  created_at: string;
  questions: Question[];
}

export interface StudentAnswerReview {
  question_id: string;
  question_text: string;
  question_type: string;
  student_response: string;
  answer_key: string;
  is_correct: boolean;
  points_awarded: number;
  feedback: string;
  misconception?: string;
  explanation: string;
  source_references: CitationItem[];
}

export interface TopicMasteryDelta {
  topic_name: string;
  prior_mastery: number;
  updated_mastery: number;
  delta: number;
  mastery_state: string;
  explanation: string;
}

export interface AssessmentResult {
  attempt_id: string;
  assessment_id: string;
  score: number;
  max_score: number;
  percentage: number;
  time_spent_seconds: number;
  inferred_misconceptions: string[];
  answers: StudentAnswerReview[];
  mastery_updates: TopicMasteryDelta[];
  recommended_revision_topics: string[];
  suggested_next_activity: string;
}

export interface TopicMastery {
  id: string;
  topic_name: string;
  current_mastery: number;
  mastery_state: 'NOVICE' | 'DEVELOPING' | 'PROFICIENT' | 'MASTERED';
  total_practices: number;
  correct_practices: number;
  last_practiced_at: string;
}

export interface DashboardStats {
  total_materials: number;
  quizzes_completed: number;
  overall_mastery: number;
  study_time_minutes: number;
  topic_masteries: TopicMastery[];
  weak_topics: TopicMastery[];
  strong_topics: TopicMastery[];
  recent_activities: Array<{ id: string; type: string; title: string; created_at: string }>;
  recommended_next_activity: string;
  ai_status: {
    provider: string;
    model: string;
    connected: boolean;
    embedding: string;
    mode_badge: string;
  };
}

export interface KnowledgeMapNode {
  id: string;
  name: string;
  category: string;
  mastery: number;
  state: string;
}

export interface KnowledgeMapEdge {
  id: string;
  source: string;
  target: string;
  strength: number;
}

export interface KnowledgeMapData {
  nodes: KnowledgeMapNode[];
  edges: KnowledgeMapEdge[];
}

export interface EvaluationRun {
  id: string;
  run_name: string;
  model_used: string;
  status: string;
  metrics: {
    faithfulness?: number;
    answer_relevancy?: number;
    context_precision?: number;
    context_recall?: number;
    citation_accuracy?: number;
    unsupported_refusal_rate?: number;
    question_verification_rate?: number;
    question_repetition_rate?: number;
  };
  learner_simulations: Record<string, {
    initial_mastery: number;
    final_mastery: number;
    sessions_to_mastery: number;
    trajectory: Array<{ session: number; mastery: number; state: string }>;
  }>;
  created_at: string;
}
