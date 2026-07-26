export interface SourceCitation {
  tradition: string;
  reference: string;
  text: string;
}

export interface ChatResponse {
  is_religious: boolean;
  reply: string;
  sources: SourceCitation[];
  traditions_searched: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceCitation[];
  isReligious?: boolean;
}
