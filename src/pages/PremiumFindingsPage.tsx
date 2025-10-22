import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Finding } from '../types';
import { Navigation } from '../components/Navigation';
import {
  AlertTriangle, AlertCircle, AlertOctagon, Info,
  Download, Share2, TrendingUp, Layers, Filter, X
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { downloadCSV, downloadExcel, downloadPDF, downloadVisualPDF, generateShareableReport } from '../utils/report-generator';

export function PremiumFindingsPage() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [filteredFindings, setFilteredFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    loadFindings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [findings, severityFilter, disciplineFilter, statusFilter]);

  async function loadFindings() {
    try {
      const data = await api.findings.list({});
      setFindings(data);
    } catch (error) {
      console.error('Failed to load findings:', error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...findings];

    if (severityFilter) {
      filtered = filtered.filter(f => f.severity === severityFilter);
    }
    if (disciplineFilter) {
      filtered = filtered.filter(f => f.discipline === disciplineFilter);
    }
    if (statusFilter) {
      filtered = filtered.filter(f => f.status === statusFilter);
    }

    setFilteredFindings(filtered);
  }

  function clearFilters() {
    setSeverityFilter('');
    setDisciplineFilter('');
    setStatusFilter('');
  }

  const stats = {
    total: findings.length,
    critical: findings.filter(f => f.severity === 'critical').length,
    high: findings.filter(f => f.severity === 'high').length,
    disciplines: new Set(findings.map(f => f.discipline)).size,
  };

  const severityData = [
    { name: 'Critical', value: findings.filter(f => f.severity === 'critical').length, color: '#dc2626' },
    { name: 'High', value: findings.filter(f => f.severity === 'high').length, color: '#ea580c' },
    { name: 'Medium', value: findings.filter(f => f.severity === 'medium').length, color: '#f59e0b' },
    { name: 'Low', value: findings.filter(f => f.severity === 'low').length, color: '#84cc16' },
  ].filter(d => d.value > 0);

  const disciplineData = Array.from(new Set(findings.map(f => f.discipline))).map(discipline => ({
    name: discipline.charAt(0).toUpperCase() + discipline.slice(1),
    count: findings.filter(f => f.discipline === discipline).length,
  }));

  function getSeverityIcon(severity: string) {
    switch (severity) {
      case 'critical':
        return <AlertOctagon className="w-5 h-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'medium':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'low':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-slate-400" />;
    }
  }

  function getSeverityColor(severity: string) {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }

  function handleDownloadCSV() {
    downloadCSV({
      timestamp: new Date().toISOString(),
      findings: filteredFindings,
    }, `findings-report-${new Date().toISOString().split('T')[0]}.csv`);
  }

  function handleDownloadExcel() {
    downloadExcel({
      timestamp: new Date().toISOString(),
      findings: filteredFindings,
    }, `findings-report-${new Date().toISOString().split('T')[0]}.xls`);
  }

  async function handleDownloadPDF() {
    await downloadPDF({
      timestamp: new Date().toISOString(),
      findings: filteredFindings,
    }, `findings-detailed-report-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  async function handleDownloadVisualPDF() {
    const findingsWithMarkups = filteredFindings.filter(f =>
      f.evidence && f.evidence.some(e => e.type === 'drawing_markup' && e.url)
    );

    console.log('Findings with markups:', findingsWithMarkups.length);
    findingsWithMarkups.forEach(f => {
      console.log(`Finding: ${f.title}`);
      const markups = f.evidence?.filter(e => e.type === 'drawing_markup') || [];
      markups.forEach(m => {
        console.log(`  - Evidence URL length: ${m.url?.length || 0}`);
        console.log(`  - Evidence URL starts: ${m.url?.substring(0, 30)}`);
      });
    });

    await downloadVisualPDF({
      timestamp: new Date().toISOString(),
      findings: filteredFindings,
    }, `findings-visual-report-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  function handleShare() {
    const url = generateShareableReport({
      timestamp: new Date().toISOString(),
      findings: filteredFindings,
    });

    const a = document.createElement('a');
    a.href = url;
    a.download = `findings-share-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);

    alert('Report exported as JSON. Share this file to collaborate with your team.');
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg pt-20">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Loading findings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg pt-20">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent mb-2">
            Scan Results
          </h1>
          <p className="text-slate-600 text-lg">Comprehensive analysis of your project findings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="glass-card rounded-2xl luxury-shadow p-6 hover:luxury-shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-4xl font-bold text-slate-900 mb-2">{stats.total}</div>
            <div className="text-sm font-semibold text-slate-600">Total Issues</div>
          </div>

          <div className="glass-card rounded-2xl luxury-shadow p-6 hover:luxury-shadow-lg transition-all border-red-100">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
                <AlertOctagon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-4xl font-bold text-red-600 mb-2">{stats.critical + stats.high}</div>
            <div className="text-sm font-semibold text-slate-600">High Severity</div>
          </div>

          <div className="glass-card rounded-2xl luxury-shadow p-6 hover:luxury-shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                <Layers className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-4xl font-bold text-slate-900 mb-2">{stats.disciplines}</div>
            <div className="text-sm font-semibold text-slate-600">Disciplines</div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 rounded-2xl luxury-shadow-lg p-6 text-white hover:scale-105 transition-transform">
            <div className="text-sm font-bold mb-2">3D Viewer</div>
            <div className="text-xs opacity-90 mb-3">Coming in Version 2</div>
            <div className="text-xs opacity-75">Visual issue tracking in 3D space</div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto mb-10">
          <div className="glass-card rounded-2xl luxury-shadow p-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">Issues by Severity</h3>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-2xl luxury-shadow mb-6">
          <div className="p-6 border-b border-slate-200/50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Filter className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-bold text-slate-900">Filters</span>
                {(severityFilter || disciplineFilter || statusFilter) && (
                  <button
                    onClick={clearFilters}
                    className="ml-2 text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Clear All
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                <select
                  value={disciplineFilter}
                  onChange={(e) => setDisciplineFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Disciplines</option>
                  <option value="architecture">Architecture</option>
                  <option value="structural">Structural</option>
                  <option value="mep">MEP</option>
                  <option value="civil">Civil</option>
                  <option value="general">General</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_review">In Review</option>
                  <option value="resolved">Resolved</option>
                  <option value="wont_fix">Won't Fix</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleDownloadCSV}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>

              <button
                onClick={handleDownloadExcel}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition"
              >
                <Download className="w-4 h-4" />
                Excel
              </button>

              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition"
              >
                <Download className="w-4 h-4" />
                Detailed PDF
              </button>

              <button
                onClick={handleDownloadVisualPDF}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-md"
              >
                <Download className="w-4 h-4" />
                Visual PDF
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
              >
                <Share2 className="w-4 h-4" />
                Share Report
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm">Severity</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm">Discipline</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm">Issue</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm">Element</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm">Project</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-700 text-sm">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFindings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No findings match the selected filters
                    </td>
                  </tr>
                ) : (
                  filteredFindings.map((finding) => (
                    <tr key={finding.id} className="hover:bg-slate-50 transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(finding.severity)}
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(finding.severity)}`}>
                            {finding.severity.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm font-medium text-slate-900 capitalize">
                          {finding.discipline}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="max-w-xs">
                          <div className="text-sm font-medium text-slate-900 mb-1">{finding.title}</div>
                          <div className="text-xs text-slate-500 line-clamp-2">{finding.description}</div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-slate-700">{finding.element_name || 'N/A'}</div>
                        <div className="text-xs text-slate-400 font-mono">{finding.element_guid.substring(0, 16)}...</div>
                      </td>
                      <td className="py-4 px-6">
                        {finding.project && (
                          <div>
                            <div className="text-sm font-medium text-slate-900">{finding.project.name}</div>
                            <div className="text-xs text-slate-500">{finding.project.client}</div>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 capitalize">
                          {finding.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
