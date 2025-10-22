import { supabase } from '../lib/supabase';

export interface UploadFileResponse {
  savedPath: string;
  originalName: string;
}

export interface ScanResponse {
  findings: Finding[];
  fileName: string;
  timestamp: string;
  filePath: string;
}

export interface Finding {
  element_guid: string;
  ifc_type: string;
  issue: string;
  severity: string;
  discipline: string;
}

export interface PastResult {
  id: string;
  fileName: string;
  timestamp: string;
  findingsCount: number;
  filePath: string;
  findings: Finding[];
}

function generateMockFindings(fileName: string): Finding[] {
  const severities = ['Critical', 'High', 'Medium', 'Low'];
  const ifcTypes = ['IfcWall', 'IfcColumn', 'IfcBeam', 'IfcSlab', 'IfcDoor', 'IfcWindow'];
  const disciplines = ['Architecture', 'Structural', 'MEP', 'General'];
  const issues = [
    'Missing required property',
    'Duplicate element detected',
    'Invalid geometry',
    'Non-standard naming convention',
    'Missing material assignment',
    'Overlapping elements',
    'Out of tolerance dimension',
  ];

  const numFindings = Math.floor(Math.random() * 8);

  if (numFindings === 0) return [];

  return Array.from({ length: numFindings }, (_, i) => ({
    element_guid: `${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`,
    ifc_type: ifcTypes[Math.floor(Math.random() * ifcTypes.length)],
    issue: issues[Math.floor(Math.random() * issues.length)],
    severity: severities[Math.floor(Math.random() * severities.length)],
    discipline: disciplines[Math.floor(Math.random() * disciplines.length)],
  }));
}

export const backendApi = {
  async uploadFile(file: File): Promise<UploadFileResponse> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const timestamp = Date.now();
    const filePath = `${user.id}/${timestamp}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('construction-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    return {
      savedPath: filePath,
      originalName: file.name,
    };
  },

  async runScan(filePath: string): Promise<ScanResponse> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const fileName = filePath.split('/').pop() || 'unknown';
    const findings = generateMockFindings(fileName);
    const timestamp = new Date().toISOString();

    const { error: insertError } = await supabase
      .from('backend_scans')
      .insert({
        user_id: user.id,
        file_name: fileName,
        file_path: filePath,
        findings: findings,
        findings_count: findings.length,
        timestamp: timestamp,
      });

    if (insertError) {
      throw new Error(`Failed to save scan: ${insertError.message}`);
    }

    return {
      findings,
      fileName,
      timestamp,
      filePath,
    };
  },

  async getResults(): Promise<PastResult[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('backend_scans')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch results: ${error.message}`);
    }

    return (data || []).map((scan) => ({
      id: scan.id,
      fileName: scan.file_name,
      timestamp: scan.timestamp,
      findingsCount: scan.findings_count,
      filePath: scan.file_path,
      findings: scan.findings || [],
    }));
  },
};
