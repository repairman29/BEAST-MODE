-- Create ML artifacts storage bucket for large training data and model files
-- Migration: 20250106000000_create_ml_artifacts_storage_bucket.sql
-- Description: Storage bucket for ML training data, models, and large JSON artifacts

-- Bucket Configuration:
-- Name: ml-artifacts
-- Public: false (private bucket - service role access only)
-- File size limit: 50MB (for large training datasets and model files)
-- Allowed MIME types: application/json, application/gzip, application/x-tar, application/zip

-- To create the bucket, run this in Supabase SQL Editor or use the Storage API:
-- 
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'ml-artifacts',
--   'ml-artifacts',
--   false, -- Private bucket
--   52428800, -- 50MB in bytes
--   ARRAY['application/json', 'application/gzip', 'application/x-tar', 'application/zip', 'text/plain']
-- )
-- ON CONFLICT (id) DO NOTHING;

-- Storage Policies (RLS):
-- Service role has full access (read, write, delete)
-- No public access (private bucket)

-- Policy 1: Service role can read all files
DROP POLICY IF EXISTS "Service role can read ML artifacts" ON storage.objects;
CREATE POLICY "Service role can read ML artifacts"
ON storage.objects
FOR SELECT
TO service_role
USING (bucket_id = 'ml-artifacts');

-- Policy 2: Service role can upload files
DROP POLICY IF EXISTS "Service role can upload ML artifacts" ON storage.objects;
CREATE POLICY "Service role can upload ML artifacts"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'ml-artifacts');

-- Policy 3: Service role can delete files
DROP POLICY IF EXISTS "Service role can delete ML artifacts" ON storage.objects;
CREATE POLICY "Service role can delete ML artifacts"
ON storage.objects
FOR DELETE
TO service_role
USING (bucket_id = 'ml-artifacts');

-- Policy 4: Service role can update files
DROP POLICY IF EXISTS "Service role can update ML artifacts" ON storage.objects;
CREATE POLICY "Service role can update ML artifacts"
ON storage.objects
FOR UPDATE
TO service_role
USING (bucket_id = 'ml-artifacts');

-- Note: This bucket is for ML artifacts only (training data, models, large JSON files)
-- Use folder structure: training-data/, models/, catalogs/, etc.

