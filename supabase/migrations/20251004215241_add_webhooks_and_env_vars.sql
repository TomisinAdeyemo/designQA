/*
  # Add Webhooks and Environment Variables Tables

  ## New Tables

  ### 1. webhooks
  - `id` (uuid, primary key) - Unique webhook identifier
  - `url` (text) - Webhook URL endpoint
  - `event_type` (text) - Event type: scan.completed, scan.failed, finding.created
  - `created_at` (timestamptz) - Creation timestamp
  - `created_by` (uuid) - User who created the webhook
  - `is_active` (boolean) - Whether webhook is active

  ### 2. environment_variables
  - `key` (text, primary key) - Variable key
  - `value` (text) - Variable value (encrypted in production)
  - `description` (text) - Variable description
  - `updated_at` (timestamptz) - Last update timestamp
  - `updated_by` (uuid) - User who updated the variable

  ## Security
  - Enable RLS on both tables
  - Only admins can manage webhooks and environment variables
*/

-- Webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('scan.completed', 'scan.failed', 'finding.created', 'issue.created')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_webhooks_event_type ON webhooks(event_type);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(is_active) WHERE is_active = true;

-- Environment variables table
CREATE TABLE IF NOT EXISTS environment_variables (
  key text PRIMARY KEY,
  value text NOT NULL,
  description text DEFAULT '',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE environment_variables ENABLE ROW LEVEL SECURITY;

-- RLS Policies for webhooks
CREATE POLICY "Admins can view webhooks"
  ON webhooks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can insert webhooks"
  ON webhooks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can update webhooks"
  ON webhooks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can delete webhooks"
  ON webhooks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'manager')
    )
  );

-- RLS Policies for environment_variables
CREATE POLICY "Admins can view env vars"
  ON environment_variables FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert env vars"
  ON environment_variables FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update env vars"
  ON environment_variables FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete env vars"
  ON environment_variables FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );