-- Tool vote widget: store votes for coming-soon tools (e.g. docx-formatter).
CREATE TABLE tool_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tool text NOT NULL,
  created_at timestamptz DEFAULT now()
);
