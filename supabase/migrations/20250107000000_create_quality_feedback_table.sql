-- Quality Feedback Table
-- Stores user feedback on quality predictions for model improvement

CREATE TABLE IF NOT EXISTS quality_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repo TEXT NOT NULL,
    predicted_quality DECIMAL(3, 2) NOT NULL CHECK (predicted_quality >= 0 AND predicted_quality <= 1),
    actual_quality DECIMAL(3, 2) CHECK (actual_quality >= 0 AND actual_quality <= 1),
    helpful BOOLEAN,
    comments TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_quality_feedback_repo ON quality_feedback(repo);
CREATE INDEX IF NOT EXISTS idx_quality_feedback_user_id ON quality_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_quality_feedback_created_at ON quality_feedback(created_at DESC);

-- RLS Policies
ALTER TABLE quality_feedback ENABLE ROW LEVEL SECURITY;

-- Users can read their own feedback
CREATE POLICY "Users can read their own feedback"
    ON quality_feedback
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert feedback
CREATE POLICY "Users can insert feedback"
    ON quality_feedback
    FOR INSERT
    WITH CHECK (true);

-- Service role can read all feedback (for analytics)
CREATE POLICY "Service role can read all feedback"
    ON quality_feedback
    FOR SELECT
    USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE quality_feedback IS 'User feedback on quality predictions for model improvement';
COMMENT ON COLUMN quality_feedback.repo IS 'Repository identifier (owner/repo format)';
COMMENT ON COLUMN quality_feedback.predicted_quality IS 'ML model predicted quality (0-1)';
COMMENT ON COLUMN quality_feedback.actual_quality IS 'User-provided actual quality (0-1, optional)';
COMMENT ON COLUMN quality_feedback.helpful IS 'Whether the prediction was helpful (optional)';
COMMENT ON COLUMN quality_feedback.comments IS 'Optional feedback text';

