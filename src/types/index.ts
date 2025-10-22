export interface Project {
  id: string;
  name: string;
  client: string;
  created_at: string;
  created_by: string | null;
  updated_at: string;
}

export interface File {
  id: string;
  project_id: string;
  key: string;
  filename: string;
  version: number;
  size: number;
  content_type: string;
  uploaded_at: string;
  uploaded_by: string | null;
}

export interface RuleSet {
  id: string;
  name: string;
  description: string;
  rules_json: Rule[];
  is_active: boolean;
  created_at: string;
  created_by: string | null;
  updated_at: string;
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  discipline: Discipline;
  parameters: Record<string, any>;
}

export interface ScanJob {
  id: string;
  project_id: string;
  file_id: string;
  rule_set_id: string;
  status: ScanStatus;
  progress: number;
  results_url: string | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  created_by: string | null;
}

export interface Finding {
  id: string;
  job_id: string;
  project_id: string;
  file_id: string;
  element_guid: string;
  element_name: string;
  title: string;
  description: string;
  recommended_fix?: string;
  severity: Severity;
  discipline: Discipline;
  rule_id: string;
  evidence: Evidence[];
  status: FindingStatus;
  created_at: string;
  project?: {
    id: string;
    name: string;
    client: string;
  };
}

export interface Evidence {
  type: 'screenshot' | 'data' | 'link' | 'drawing_markup';
  url?: string;
  data?: Record<string, any>;
  caption?: string;
  markup?: DrawingMarkup;
}

export interface DrawingMarkup {
  drawingUrl: string;
  drawingName: string;
  annotations: Annotation[];
  timestamp: string;
}

export interface Annotation {
  id: string;
  type: 'circle' | 'arrow' | 'highlight' | 'text';
  coordinates: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  color: string;
  label?: string;
  description?: string;
}

export interface Issue {
  id: string;
  project_id: string;
  finding_id: string | null;
  title: string;
  description: string;
  type: IssueType;
  assignee_id: string | null;
  due_date: string | null;
  status: IssueStatus;
  priority: Priority;
  attachments: Attachment[];
  created_at: string;
  created_by: string | null;
  updated_at: string;
}

export interface Attachment {
  filename: string;
  url: string;
  size: number;
  type: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type Discipline = 'architecture' | 'structural' | 'mep' | 'civil' | 'general';
export type ScanStatus = 'pending' | 'running' | 'completed' | 'failed';
export type FindingStatus = 'open' | 'in_review' | 'resolved' | 'wont_fix';
export type IssueStatus = 'open' | 'pending' | 'resolved' | 'closed';
export type IssueType = 'rfi' | 'issue' | 'observation';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type UserRole = 'admin' | 'manager' | 'reviewer' | 'viewer';

export interface DashboardStats {
  totalProjects: number;
  recentScans: number;
  openFindings: number;
  criticalFindings: number;
}

export interface UploadRequest {
  filename: string;
  contentType: string;
  projectId: string;
}

export interface UploadResponse {
  uploadUrl: string;
  key: string;
  fileId: string;
}

export interface CreateScanRequest {
  projectId: string;
  fileId: string;
  ruleSetId: string;
  runOptions?: {
    scheduledAt?: string;
  };
}

export interface CreateScanResponse {
  jobId: string;
}

export interface ScanStatusResponse {
  jobId: string;
  status: ScanStatus;
  progress: number;
  resultsUrl?: string;
  errorMessage?: string;
}

export interface FindingsFilters {
  projectId?: string;
  severity?: Severity[];
  discipline?: Discipline[];
  status?: FindingStatus[];
  fileId?: string;
  search?: string;
}

export interface Webhook {
  id: string;
  url: string;
  event_type: WebhookEventType;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
}

export interface EnvironmentVariable {
  key: string;
  value: string;
  description: string;
  updated_at: string;
  updated_by: string | null;
}

export type WebhookEventType = 'scan.completed' | 'scan.failed' | 'finding.created' | 'issue.created';

export interface WebhookPayload {
  event: 'scan.completed' | 'scan.failed';
  jobId: string;
  projectId: string;
  fileId: string;
  status: ScanStatus;
  timestamp: string;
  data: {
    findingsCount?: number;
    resultsUrl?: string;
    errorMessage?: string;
  };
}
