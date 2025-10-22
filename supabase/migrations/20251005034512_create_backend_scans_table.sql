/*
  # Create backend_scans table for storing scan results

  1. New Tables
    - `backend_scans`
      - `id` (uuid, primary key) - Unique identifier for each scan
      - `user_id` (uuid, foreign key) - References auth.users
      - `file_name` (text) - Original name of the uploaded file
      - `file_path` (text) - Path to the file in Supabase Storage
      - `findings` (jsonb) - Array of finding objects with scan results
      - `findings_count` (integer) - Count of findings for quick reference
      - `timestamp` (timestamptz) - When the scan was performed
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on `backend_scans` table
    - Add policy for users to read their own scan results
    - Add policy for users to insert their own scan results
    - Add policy for users to delete their own scan results

  3. Storage
    - Create storage bucket for construction files
    - Enable RLS on storage bucket
    - Add policies for authenticated users to upload and read their own files
*/

CREATE TABLE IF NOT EXISTS backend_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  findings jsonb DEFAULT '[]'::jsonb,
  findings_count integer DEFAULT 0,
  timestamp timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE backend_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own scan results"
  ON backend_scans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scan results"
  ON backend_scans
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scan results"
  ON backend_scans
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_backend_scans_user_id ON backend_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_backend_scans_timestamp ON backend_scans(timestamp DESC);

INSERT INTO storage.buckets (id, name, public)
VALUES ('construction-files', 'construction-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'construction-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can read own files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'construction-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'construction-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
