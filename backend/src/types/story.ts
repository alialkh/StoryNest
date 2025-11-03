export interface Story {
  id: string;
  user_id: string;
  prompt: string;
  content: string;
  title: string | null;
  genre: string | null;
  tone: string | null;
  continued_from_id: string | null;
  word_count: number;
  share_id: string | null;
  created_at: string;
}
