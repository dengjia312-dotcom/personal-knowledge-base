export interface KnowledgeNode {
  id: string;
  title: string;
  category: string;
  categoryColor: string; // hex, e.g. '#6366f1'
  summary: string;
  relatedIds: string[];
  suggestedQuestions: string[];
  mockAnswers: string[]; // index-matched with suggestedQuestions
  gx: number; // normalized graph x ∈ [0.08, 0.92]
  gy: number; // normalized graph y ∈ [0.08, 0.92]
}

export interface CategoryGroup {
  name: string;
  color: string;
  nodes: KnowledgeNode[];
}
