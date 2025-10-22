import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ScanJob, Project, File, RuleSet } from '../types';
import { Clock, CheckCircle, XCircle, Loader, PlayCircle, FileText } from 'lucide-react';

export function CollectorsPage() {
  const [jobs, setJobs] = useState<ScanJob[]>([]);
  const [projects, setProjects] = useState<Map<string, Project>>(new Map());
  const [files, setFiles] = useState<Map<string, File>>(new Map());
  const [ruleSets, setRuleSets] = useState<Map<string, RuleSet>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const [jobsData, projectsData, ruleSetsData] = await Promise.all([
        api.scans.list(),
        api.projects.list(),
        api.ruleSets.list(),
      ]);

      setJobs(jobsData);

      const projectsMap = new Map<string, Project>();
      projectsData.forEach(p => projectsMap.set(p.id, p));
      setProjects(projectsMap);

      const ruleSetsMap = new Map<string, RuleSet>();
      ruleSetsData.forEach(r => ruleSetsMap.set(r.id, r));
      setRuleSets(ruleSetsMap);

      const fileIds = [...new Set(jobsData.map(j => j.file_id))];
      const filesMap = new Map<string, File>();

      for (const projectId of projectsMap.keys()) {
        try {
          const projectFiles = await api.files.list(projectId);
          projectFiles.forEach(f => filesMap.set(f.id, f));
        } catch (error) {
          console.error(`Failed to load files for project ${projectId}:`, error);
        }
      }

      setFiles(filesMap);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-slate-500" />;
      case 'running':
        return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-slate-500" />;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending':
        return 'bg-slate-100 text-slate-700';
      case 'running':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading collectors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Scan Collectors</h1>
          <p className="text-slate-600 mt-2">Monitor all scan jobs across projects</p>
        </div>

        {jobs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <PlayCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Scan Jobs Yet</h3>
            <p className="text-slate-600 mb-6">Create your first scan to see it appear here</p>
            <a
              href="/scans/create"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              <PlayCircle className="w-5 h-5" />
              Create Scan
            </a>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Job ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Project</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">File</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Rule Set</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Progress</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Created</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobs.map((job) => {
                    const project = projects.get(job.project_id);
                    const file = files.get(job.file_id);
                    const ruleSet = ruleSets.get(job.rule_set_id);

                    return (
                      <tr key={job.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4">
                          <div className="font-mono text-xs text-slate-600">
                            {job.id.slice(0, 8)}...
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">
                            {project?.name || 'Unknown'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {project?.client}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-400" />
                            <div>
                              <div className="text-sm text-slate-900">
                                {file?.filename || 'Unknown'}
                              </div>
                              {file && (
                                <div className="text-xs text-slate-500">
                                  v{file.version}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-slate-900">
                            {ruleSet?.name || 'Unknown'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(job.status)}
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                                job.status
                              )}`}
                            >
                              {job.status}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {job.progress}%
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-slate-600">
                            {new Date(job.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(job.created_at).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <a
                            href={`/scans/${job.id}`}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            View Details
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">About Collectors</h3>
          <p className="text-sm text-blue-800">
            This page shows all scan jobs (collectors) across your projects. Each collector represents a scan job that processes a BIM file against a specific rule set. The page auto-refreshes every 5 seconds to show real-time updates.
          </p>
        </div>
      </div>
    </div>
  );
}
