import { supabase } from '../lib/supabase';
import {
  Project,
  File,
  RuleSet,
  ScanJob,
  Finding,
  Issue,
  DashboardStats,
  UploadRequest,
  UploadResponse,
  CreateScanRequest,
  CreateScanResponse,
  ScanStatusResponse,
  FindingsFilters,
  Webhook,
  EnvironmentVariable,
  UserProfile,
} from '../types';

export const api = {
  projects: {
    async list(): Promise<Project[]> {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },

    async get(id: string): Promise<Project> {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },

    async create(name: string, client: string): Promise<Project> {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('projects')
        .insert({ name, client, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id: string, updates: Partial<Project>): Promise<Project> {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  files: {
    async list(projectId: string): Promise<File[]> {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('project_id', projectId)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },

    async get(id: string): Promise<File> {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },

    async requestUpload(request: UploadRequest): Promise<UploadResponse> {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const key = `${request.projectId}/${Date.now()}-${request.filename}`;

      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .insert({
          project_id: request.projectId,
          key,
          filename: request.filename,
          content_type: request.contentType,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (fileError) throw fileError;

      return {
        uploadUrl: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/files/${key}`,
        key,
        fileId: fileData.id,
      };
    },
  },

  ruleSets: {
    async list(): Promise<RuleSet[]> {
      const { data, error } = await supabase
        .from('rule_sets')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },

    async get(id: string): Promise<RuleSet> {
      const { data, error } = await supabase
        .from('rule_sets')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },

    async create(name: string, description: string, rulesJson: any): Promise<RuleSet> {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('rule_sets')
        .insert({
          name,
          description,
          rules_json: rulesJson,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id: string, updates: Partial<RuleSet>): Promise<RuleSet> {
      const { data, error } = await supabase
        .from('rule_sets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('rule_sets')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  scans: {
    async create(request: CreateScanRequest): Promise<CreateScanResponse> {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('scan_jobs')
        .insert({
          project_id: request.projectId,
          file_id: request.fileId,
          rule_set_id: request.ruleSetId,
          status: 'completed',
          progress: 100,
          finished_at: new Date().toISOString(),
          results_url: `https://mockapi.example.com/results/${crypto.randomUUID()}`,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      const severities = ['critical', 'high', 'medium', 'low'];
      const ifcTypes = ['IfcWall', 'IfcColumn', 'IfcBeam', 'IfcSlab', 'IfcDoor', 'IfcWindow', 'IfcSpace', 'IfcFlowTerminal', 'IfcFireSuppressionTerminal'];
      const disciplines = ['architecture', 'structural', 'mep', 'civil', 'general'];
      const issueTypes = [
        { title: 'Missing Fire Rating', desc: 'Wall assembly does not have required fire rating specified', discipline: 'architecture', severity: 'high' },
        { title: 'Missing Room Name', desc: 'Space element does not have a room name assigned', discipline: 'architecture', severity: 'medium' },
        { title: 'Room Area Mismatch', desc: 'Calculated room area does not match specified area', discipline: 'architecture', severity: 'low' },
        { title: 'Plumbing Fixture Count Below Code', desc: 'Number of plumbing fixtures is below minimum code requirements', discipline: 'mep', severity: 'critical' },
        { title: 'Electrical Panel Missing Breaker Sizes', desc: 'Electrical panel does not specify breaker amperage', discipline: 'mep', severity: 'high' },
        { title: 'Missing Sprinkler Coverage', desc: 'Zone does not have adequate sprinkler coverage per code', discipline: 'mep', severity: 'critical' },
        { title: 'Invalid Geometry', desc: 'Element geometry does not meet standards', discipline: 'general', severity: 'medium' },
        { title: 'Non-Standard Naming', desc: 'Element naming does not follow project conventions', discipline: 'general', severity: 'low' },
        { title: 'Missing Material Assignment', desc: 'Element does not have a material assigned', discipline: 'architecture', severity: 'medium' },
        { title: 'Overlapping Elements', desc: 'Element overlaps with other elements creating clash', discipline: 'structural', severity: 'high' },
        { title: 'Dimension Out of Tolerance', desc: 'Element dimensions exceed acceptable tolerances', discipline: 'structural', severity: 'medium' },
        { title: 'Load Bearing Element Undersized', desc: 'Structural element dimensions insufficient for load requirements', discipline: 'structural', severity: 'critical' },
      ];

      const numFindings = Math.floor(Math.random() * 10) + 3;

      for (let i = 0; i < numFindings; i++) {
        const issueType = issueTypes[Math.floor(Math.random() * issueTypes.length)];
        const ifcType = ifcTypes[Math.floor(Math.random() * ifcTypes.length)];

        await supabase.from('findings').insert({
          job_id: data.id,
          project_id: request.projectId,
          file_id: request.fileId,
          element_guid: `${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`,
          element_name: `${ifcType}_${Math.floor(Math.random() * 1000)}`,
          title: issueType.title,
          description: issueType.desc,
          severity: issueType.severity,
          discipline: issueType.discipline,
          rule_id: `rule_${issueType.title.toLowerCase().replace(/\s+/g, '_')}`,
          evidence: [],
          status: 'open',
        });
      }

      return { jobId: data.id };
    },

    async getStatus(jobId: string): Promise<ScanStatusResponse> {
      const { data, error } = await supabase
        .from('scan_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;

      return {
        jobId: data.id,
        status: data.status,
        progress: data.progress,
        resultsUrl: data.results_url || undefined,
        errorMessage: data.error_message || undefined,
      };
    },

    async list(projectId?: string): Promise<ScanJob[]> {
      let query = supabase
        .from('scan_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async complete(jobId: string): Promise<void> {
      const resultsUrl = `https://mockapi.example.com/results/${jobId}`;

      const { error } = await supabase
        .from('scan_jobs')
        .update({
          status: 'completed',
          progress: 100,
          finished_at: new Date().toISOString(),
          results_url: resultsUrl,
        })
        .eq('id', jobId);

      if (error) throw error;
    },
  },

  findings: {
    async list(filters: FindingsFilters): Promise<Finding[]> {
      let query = supabase
        .from('findings')
        .select(`
          *,
          project:projects(id, name, client)
        `)
        .order('created_at', { ascending: false });

      if (filters.projectId) {
        query = query.eq('project_id', filters.projectId);
      }
      if (filters.severity && filters.severity.length > 0) {
        query = query.in('severity', filters.severity);
      }
      if (filters.discipline && filters.discipline.length > 0) {
        query = query.in('discipline', filters.discipline);
      }
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      if (filters.fileId) {
        query = query.eq('file_id', filters.fileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async get(id: string): Promise<Finding> {
      const { data, error } = await supabase
        .from('findings')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },

    async updateStatus(id: string, status: string): Promise<Finding> {
      const { data, error } = await supabase
        .from('findings')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async updateEvidence(id: string, evidence: any[]): Promise<Finding> {
      const { data, error } = await supabase
        .from('findings')
        .update({ evidence })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  },

  issues: {
    async list(projectId?: string): Promise<Issue[]> {
      let query = supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },

    async get(id: string): Promise<Issue> {
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },

    async create(issue: Omit<Issue, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<Issue> {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('issues')
        .insert({
          ...issue,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id: string, updates: Partial<Issue>): Promise<Issue> {
      const { data, error } = await supabase
        .from('issues')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  },

  dashboard: {
    async getStats(): Promise<DashboardStats> {
      const [projectsResult, scansResult, findingsResult, criticalResult] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('scan_jobs').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('findings').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('findings').select('id', { count: 'exact', head: true }).eq('severity', 'critical').eq('status', 'open'),
      ]);

      return {
        totalProjects: projectsResult.count || 0,
        recentScans: scansResult.count || 0,
        openFindings: findingsResult.count || 0,
        criticalFindings: criticalResult.count || 0,
      };
    },
  },

  webhooks: {
    async list(): Promise<Webhook[]> {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },

    async create(url: string, eventType: string): Promise<Webhook> {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('webhooks')
        .insert({ url, event_type: eventType, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },

    async toggle(id: string, isActive: boolean): Promise<Webhook> {
      const { data, error } = await supabase
        .from('webhooks')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  },

  environmentVariables: {
    async list(): Promise<EnvironmentVariable[]> {
      const { data, error } = await supabase
        .from('environment_variables')
        .select('*')
        .order('key', { ascending: true });
      if (error) throw error;
      return data || [];
    },

    async upsert(key: string, value: string, description: string): Promise<EnvironmentVariable> {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('environment_variables')
        .upsert({ key, value, description, updated_by: user.id, updated_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async delete(key: string): Promise<void> {
      const { error } = await supabase
        .from('environment_variables')
        .delete()
        .eq('key', key);
      if (error) throw error;
    },
  },

  users: {
    async list(): Promise<UserProfile[]> {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },

    async updateRole(userId: string, role: string): Promise<UserProfile> {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ role })
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  },

  reports: {
    async downloadPDF(scanId: string): Promise<void> {
      const { data: scan, error: scanError } = await supabase
        .from('backend_scans')
        .select('*')
        .eq('id', scanId)
        .maybeSingle();

      if (scanError || !scan) {
        throw new Error('Scan not found');
      }

      const apiUrl = `/api/report/${scanId}/visual`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: scan.file_name,
          filePath: scan.file_path,
          findings: scan.findings || [],
          timestamp: scan.timestamp,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Visual report generation failed: ${errorText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const baseName = scan.file_name.replace(/\.[^/.]+$/, '');
      a.download = `${baseName}-visual-markup.pdf`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    },
  },
};
