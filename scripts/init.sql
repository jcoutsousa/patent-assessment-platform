-- Patent Assessment Platform Database Initialization Script

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";  -- For embedding-based similarity search

-- Create custom types
CREATE TYPE assessment_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE document_type AS ENUM ('pdf', 'docx', 'txt', 'image');
CREATE TYPE technical_field AS ENUM ('software', 'electronics', 'mechanical', 'chemical', 'biotech', 'medical', 'other');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_assessment_id ON documents(assessment_id);
CREATE INDEX IF NOT EXISTS idx_prior_art_assessment_id ON prior_art_searches(assessment_id);

-- Create full-text search indexes
CREATE INDEX IF NOT EXISTS idx_assessments_description_fts ON assessments USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_documents_extracted_text_fts ON documents USING gin(to_tsvector('english', extracted_text));

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO patent_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO patent_user;

-- Initial data for testing
INSERT INTO users (id, email, name, organization, created_at)
VALUES (
    gen_random_uuid(),
    'demo@example.com',
    'Demo User',
    'Patent Assessment Platform',
    NOW()
) ON CONFLICT DO NOTHING;