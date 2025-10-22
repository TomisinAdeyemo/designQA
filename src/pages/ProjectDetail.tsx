import { useEffect, useState } from 'react';
import { useParams } from '../lib/router';
import { api } from '../services/api';
import { Project, File, ScanJob } from '../types';
import { ArrowLeft, Upload, Play, FileText, Clock } from 'lucide-react';

export function ProjectDetail() {
  const params = useParams();
  const projectId = params.id;
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [scans, setScans] = useState<ScanJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) loadData();
  }, [projectId]);

  async function loadData() {
    if (!projectId) return;
    try {
      const [projectData, filesData, scansData] = await Promise.all([
        api.projects.get(projectId),
        api.files.list(projectId),
        api.scans.list(projectId),
      ]);
      setProject(projectData);
      setFiles(filesData);
      setScans(scansData);
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  if (!project) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Project not found</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <a href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </a>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
              <p className="text-slate-600 mt-1">Client: {project.client}</p>
            </div>
            <a
              href={`/projects/${projectId}/upload`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <Upload className="w-4 h-4" />
              Upload File
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Files
            </h2>
            <div className="space-y-3">
              {files.length === 0 ? (
                <p className="text-slate-500 text-sm">No files uploaded</p>
              ) : (
                files.map((file) => (
                  <div key={file.id} className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-slate-900">{file.filename}</h3>
                        <p className="text-sm text-slate-600">
                          v{file.version} • {new Date(file.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                      <a
                        href={`/scans/create?fileId=${file.id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                      >
                        <Play className="w-4 h-4" />
                        Scan
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Scan History
            </h2>
            <div className="space-y-3">
              {scans.length === 0 ? (
                <p className="text-slate-500 text-sm">No scans yet</p>
              ) : (
                scans.map((scan) => (
                  <a
                    key={scan.id}
                    href={`/scans/${scan.id}`}
                    className="block p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(scan.status)}`}>
                          {scan.status}
                        </span>
                        <p className="text-sm text-slate-600 mt-1">
                          {new Date(scan.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {scan.status === 'running' && (
                        <div className="text-sm font-medium text-blue-600">{scan.progress}%</div>
                      )}
                    </div>
                  </a>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-700';
    case 'running':
      return 'bg-blue-100 text-blue-700';
    case 'failed':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}
