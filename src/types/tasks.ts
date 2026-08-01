export interface TaskNoteAnalysisTask {
  title: string;
  priority: 'high' | 'medium' | 'low';
}

export interface TaskNoteAnalysis {
  summary: string;
  tasks: TaskNoteAnalysisTask[];
  focus: string;
  source: string;
}

export interface TaskNote {
  id: string;
  title: string;
  content: string;
  note_date: string;
  labels: string[];
  ai_analysis: TaskNoteAnalysis | null;
  created_at: string;
  updated_at: string;
}

export interface TaskNoteDateSummary {
  note_date: string;
  note_count: number;
}

export interface TaskNoteInput {
  title: string;
  content: string;
  note_date: string;
  labels: string[];
}

export interface TaskNoteFilters {
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  label?: string;
  q?: string;
}

export interface TaskNoteSummarySection {
  label: string;
  summary: string;
  highlights: string[];
  tasks: TaskNoteAnalysisTask[];
}

export interface TaskNoteRangeSummary {
  date_from: string;
  date_to: string;
  note_count: number;
  overview: string;
  sections: TaskNoteSummarySection[];
  source: string;
}

export interface TaskUserProfile {
  email: string;
  created_at: string;
}

export interface TaskAuthResponse {
  token: string;
  user: TaskUserProfile;
}
