/*
  # ConstructQA MVP Database Schema

  ## Overview
  This migration creates the complete database schema for ConstructQA, a BIM/design deliverable review platform.

  ## New Tables

  ### 1. projects
  - `id` (uuid, primary key) - Unique project identifier
  - `name` (text) - Project name
  - `client` (text) - Client name
  - `created_at` (timestamptz) - Creation timestamp
  - `created_by` (uuid) - User who created the project
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. files
  - `id` (uuid, primary key) - Unique file identifier
  - `project_id` (uuid, foreign key) - Reference to project
  - `key` (text) - S3 storage key
  - `filename` (text) - Original filename
  - `version` (integer) - File version number
  - `size` (bigint) - File size in bytes
  - `content_type` (text) - MIME type
  - `uploaded_at` (timestamptz) - Upload timestamp
  - `uploaded_by` (uuid) - User who uploaded the file

  ### 3. rule_sets
  - `id` (uuid, primary key) - Unique ruleset identifier
  - `name` (text) - Ruleset name
  - `description` (text) - Ruleset description
  - `rules_json` (jsonb) - Rule definitions in JSON format
  - `is_active` (boolean) - Whether ruleset is active
  - `created_at` (timestamptz) - Creation timestamp
  - `created_by` (uuid) - User who created the ruleset
  - `updated_at` (timestamptz) - Last update timestamp

  ### 4. scan_jobs
  - `id` (uuid, primary key) - Unique job identifier
  - `project_id` (uuid, foreign key) - Reference to project
  - `file_id` (uuid, foreign key) - Reference to file being scanned
  - `rule_set_id` (uuid, foreign key) - Reference to ruleset used
  - `status` (text) - Job status: pending, running, completed, failed
  - `progress` (integer) - Progress percentage (0-100)
  - `results_url` (text) - URL to detailed results
  - `error_message` (text) - Error message if failed
  - `created_at` (timestamptz) - Job creation time
  - `started_at` (timestamptz) - Job start time
  - `finished_at` (timestamptz) - Job completion time
  - `created_by` (uuid) - User who created the job

  ### 5. findings
  - `id` (uuid, primary key) - Unique finding identifier
  - `job_id` (uuid, foreign key) - Reference to scan job
  - `project_id` (uuid, foreign key) - Reference to project
  - `file_id` (uuid, foreign key) - Reference to file
  - `element_guid` (text) - BIM element GUID
  - `element_name` (text) - BIM element name
  - `title` (text) - Finding title
  - `description` (text) - Finding description
  - `severity` (text) - Severity: critical, high, medium, low, info
  - `discipline` (text) - Discipline: architecture, structural, mep, civil, general
  - `rule_id` (text) - ID of rule that triggered this finding
  - `evidence` (jsonb) - Array of evidence (screenshots, data)
  - `status` (text) - Status: open, in_review, resolved, wont_fix
  - `created_at` (timestamptz) - Finding creation time

  ### 6. issues (RFIs)
  - `id` (uuid, primary key) - Unique issue identifier
  - `project_id` (uuid, foreign key) - Reference to project
  - `finding_id` (uuid, foreign key, nullable) - Optional reference to finding
  - `title` (text) - Issue title
  - `description` (text) - Issue description
  - `type` (text) - Issue type: rfi, issue, observation
  - `assignee_id` (uuid) - Assigned user
  - `due_date` (date) - Due date
  - `status` (text) - Status: open, pending, resolved, closed
  - `priority` (text) - Priority: critical, high, medium, low
  - `attachments` (jsonb) - Array of attachment references
  - `created_at` (timestamptz) - Issue creation time
  - `created_by` (uuid) - User who created the issue
  - `updated_at` (timestamptz) - Last update time

  ### 7. user_profiles
  - `id` (uuid, primary key) - References auth.users(id)
  - `email` (text) - User email
  - `full_name` (text) - User full name
  - `role` (text) - User role: admin, manager, reviewer, viewer
  - `avatar_url` (text) - Avatar URL
  - `created_at` (timestamptz) - Profile creation time
  - `updated_at` (timestamptz) - Last update time

  ## Security
  - Enable Row Level Security (RLS) on all tables
  - Create policies for authenticated users based on role and ownership
  - Restrict sensitive operations to admin/manager roles

  ## Indexes
  - Add indexes for foreign keys and frequently queried columns
  - Add composite indexes for common filter combinations
*/

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  client text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Files table
CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  key text NOT NULL,
  filename text NOT NULL,
  version integer DEFAULT 1,
  size bigint DEFAULT 0,
  content_type text DEFAULT '',
  uploaded_at timestamptz DEFAULT now(),
  uploaded_by uuid REFERENCES auth.users(id)
);

ALTER TABLE files ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_files_project_id ON files(project_id);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_at ON files(uploaded_at DESC);

-- Rule sets table
CREATE TABLE IF NOT EXISTS rule_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  rules_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE rule_sets ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_rule_sets_active ON rule_sets(is_active) WHERE is_active = true;

-- Scan jobs table
CREATE TABLE IF NOT EXISTS scan_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_id uuid NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  rule_set_id uuid NOT NULL REFERENCES rule_sets(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  results_url text,
  error_message text,
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz,
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE scan_jobs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_scan_jobs_project_id ON scan_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_scan_jobs_status ON scan_jobs(status);
CREATE INDEX IF NOT EXISTS idx_scan_jobs_created_at ON scan_jobs(created_at DESC);

-- Findings table
CREATE TABLE IF NOT EXISTS findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES scan_jobs(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_id uuid NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  element_guid text DEFAULT '',
  element_name text DEFAULT '',
  title text NOT NULL,
  description text DEFAULT '',
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  discipline text DEFAULT 'general' CHECK (discipline IN ('architecture', 'structural', 'mep', 'civil', 'general')),
  rule_id text DEFAULT '',
  evidence jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'wont_fix')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE findings ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_findings_project_id ON findings(project_id);
CREATE INDEX IF NOT EXISTS idx_findings_job_id ON findings(job_id);
CREATE INDEX IF NOT EXISTS idx_findings_severity ON findings(severity);
CREATE INDEX IF NOT EXISTS idx_findings_status ON findings(status);
CREATE INDEX IF NOT EXISTS idx_findings_discipline ON findings(discipline);

-- Issues (RFIs) table
CREATE TABLE IF NOT EXISTS issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  finding_id uuid REFERENCES findings(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text DEFAULT '',
  type text DEFAULT 'rfi' CHECK (type IN ('rfi', 'issue', 'observation')),
  assignee_id uuid REFERENCES auth.users(id),
  due_date date,
  status text DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'closed')),
  priority text DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_issues_project_id ON issues(project_id);
CREATE INDEX IF NOT EXISTS idx_issues_finding_id ON issues(finding_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_assignee_id ON issues(assignee_id);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text DEFAULT '',
  role text DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'reviewer', 'viewer')),
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Projects: Authenticated users can read all projects, only creators/admins can modify
CREATE POLICY "Users can view all projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators and admins can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "Admins can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Files: Users can view files in projects they can access
CREATE POLICY "Users can view files"
  ON files FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can upload files"
  ON files FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Admins can delete files"
  ON files FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Rule sets: All authenticated users can view, only admins can modify
CREATE POLICY "Users can view rule sets"
  ON rule_sets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage rule sets"
  ON rule_sets FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Scan jobs: Users can view and create scan jobs
CREATE POLICY "Users can view scan jobs"
  ON scan_jobs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create scan jobs"
  ON scan_jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "System can update scan jobs"
  ON scan_jobs FOR UPDATE
  TO authenticated
  USING (true);

-- Findings: Users can view findings
CREATE POLICY "Users can view findings"
  ON findings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create findings"
  ON findings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update finding status"
  ON findings FOR UPDATE
  TO authenticated
  USING (true);

-- Issues: Users can view and create issues
CREATE POLICY "Users can view issues"
  ON issues FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create issues"
  ON issues FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update assigned or created issues"
  ON issues FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by OR 
    auth.uid() = assignee_id OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- User profiles: Users can view all profiles, only update their own
CREATE POLICY "Users can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Insert default MVP Safety Rules ruleset
INSERT INTO rule_sets (name, description, rules_json, is_active)
VALUES (
  'MVP Safety Rules',
  'Basic safety compliance rules for construction site review',
  '[
    {
      "id": "SAFE-001",
      "name": "Fall Protection Required",
      "description": "Check for fall protection at edges and openings above 6 feet",
      "severity": "critical",
      "discipline": "general",
      "parameters": {
        "heightThreshold": 6,
        "unit": "feet"
      }
    },
    {
      "id": "SAFE-002",
      "name": "Guardrail Height Compliance",
      "description": "Guardrails must be between 42-45 inches high",
      "severity": "high",
      "discipline": "architecture",
      "parameters": {
        "minHeight": 42,
        "maxHeight": 45,
        "unit": "inches"
      }
    },
    {
      "id": "SAFE-003",
      "name": "Stair Riser Consistency",
      "description": "Stair riser height variation must not exceed 3/16 inch",
      "severity": "medium",
      "discipline": "architecture",
      "parameters": {
        "maxVariation": 0.1875,
        "unit": "inches"
      }
    },
    {
      "id": "SAFE-004",
      "name": "Emergency Exit Clearance",
      "description": "Emergency exits must have 36 inch minimum clear width",
      "severity": "critical",
      "discipline": "architecture",
      "parameters": {
        "minClearWidth": 36,
        "unit": "inches"
      }
    },
    {
      "id": "SAFE-005",
      "name": "Fire Extinguisher Placement",
      "description": "Fire extinguishers must be within 75 feet travel distance",
      "severity": "high",
      "discipline": "general",
      "parameters": {
        "maxTravelDistance": 75,
        "unit": "feet"
      }
    },
    {
      "id": "CODE-001",
      "name": "Minimum Ceiling Height",
      "description": "Habitable rooms must have minimum 7.5 feet ceiling height",
      "severity": "high",
      "discipline": "architecture",
      "parameters": {
        "minHeight": 7.5,
        "unit": "feet"
      }
    },
    {
      "id": "CODE-002",
      "name": "ADA Ramp Slope",
      "description": "Accessible ramps must not exceed 1:12 slope ratio",
      "severity": "critical",
      "discipline": "architecture",
      "parameters": {
        "maxSlope": 0.0833,
        "ratio": "1:12"
      }
    },
    {
      "id": "MEP-001",
      "name": "Electrical Panel Clearance",
      "description": "Electrical panels require 36 inch clear working space",
      "severity": "high",
      "discipline": "mep",
      "parameters": {
        "minClearance": 36,
        "unit": "inches"
      }
    }
  ]'::jsonb,
  true
)
ON CONFLICT DO NOTHING;