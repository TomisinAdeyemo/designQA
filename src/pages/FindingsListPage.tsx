import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Finding, FindingsFilters, Severity, Discipline } from '../types';
import { Filter, AlertCircle, Download } from 'lucide-react';

export function FindingsListPage() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [filters, setFilters] = useState<FindingsFilters>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFindings();
  }, [filters]);

  async function loadFindings() {
    try {
      const data = await api.findings.list(filters);
      setFindings(data);
    } catch (error) {
      console.error('Failed to load findings:', error);
    } finally {
      setLoading(false);
    }
  }

  function downloadReport() {
    const csvHeader = 'Project,Client,Severity,Discipline,Title,Description,Element Name,Element GUID,Status,Created At\n';
    const csvRows = findings.map(f => {
      const project = f.project ? `${f.project.name}` : 'N/A';
      const client = f.project ? `${f.project.client}` : 'N/A';
      return `"${project}","${client}","${f.severity}","${f.discipline}","${f.title}","${f.description}","${f.element_name}","${f.element_guid}","${f.status}","${new Date(f.created_at).toLocaleString()}"`;
    }).join('\n');

    const csv = csvHeader + csvRows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `findings-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Findings</h1>
          {findings.length > 0 && (
            <button
              onClick={downloadReport}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download Report
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-slate-600" />
            <h2 className="font-semibold text-slate-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Severity</label>
              <select
                onChange={(e) => setFilters({ ...filters, severity: e.target.value ? [e.target.value as Severity] : undefined })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              >
                <option value="">All</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
                <option value="info">Info</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Discipline</label>
              <select
                onChange={(e) => setFilters({ ...filters, discipline: e.target.value ? [e.target.value as Discipline] : undefined })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              >
                <option value="">All</option>
                <option value="architecture">Architecture</option>
                <option value="structural">Structural</option>
                <option value="mep">MEP</option>
                <option value="civil">Civil</option>
                <option value="general">General</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <select
                onChange={(e) => setFilters({ ...filters, status: e.target.value ? [e.target.value as any] : undefined })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              >
                <option value="">All</option>
                <option value="open">Open</option>
                <option value="in_review">In Review</option>
                <option value="resolved">Resolved</option>
                <option value="wont_fix">Won't Fix</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {findings.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <p className="text-slate-500">No findings found</p>
            </div>
          ) : (
            findings.map((finding) => (
              <a
                key={finding.id}
                href={`/findings/${finding.id}`}
                className="block bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:border-blue-300 hover:shadow-md transition"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${getSeverityColor(finding.severity)}`}>
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-slate-900">{finding.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityBadge(finding.severity)}`}>
                        {finding.severity}
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {finding.discipline}
                      </span>
                    </div>
                    {finding.project && (
                      <p className="text-sm text-blue-600 font-medium mb-1">
                        {finding.project.name} - {finding.project.client}
                      </p>
                    )}
                    <p className="text-sm text-slate-600">{finding.description}</p>
                    {finding.element_name && (
                      <p className="text-xs text-slate-500 mt-2">Element: {finding.element_name}</p>
                    )}
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-600';
    case 'high':
      return 'bg-orange-100 text-orange-600';
    case 'medium':
      return 'bg-amber-100 text-amber-600';
    case 'low':
      return 'bg-yellow-100 text-yellow-600';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

function getSeverityBadge(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-700';
    case 'high':
      return 'bg-orange-100 text-orange-700';
    case 'medium':
      return 'bg-amber-100 text-amber-700';
    case 'low':
      return 'bg-yellow-100 text-yellow-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}
