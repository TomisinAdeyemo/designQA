import { useEffect, useState } from 'react';
import { backendApi, PastResult } from '../services/backend-api';
import { useScanStore } from '../lib/scan-store';
import { Navigation } from '../components/Navigation';
import { api } from '../services/api';
import { downloadPDF } from '../utils/report-generator';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Clock, FileText, AlertCircle, Eye, Loader, Download, CheckCircle, FileCheck } from 'lucide-react';

function getFileTypeBadge(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const badges: Record<string, { label: string; color: string; bg: string }> = {
    'ifc': { label: 'IFC', color: 'text-blue-700', bg: 'bg-blue-100' },
    'rvt': { label: 'RVT', color: 'text-purple-700', bg: 'bg-purple-100' },
    'dwg': { label: 'DWG', color: 'text-orange-700', bg: 'bg-orange-100' },
    'dxf': { label: 'DXF', color: 'text-orange-700', bg: 'bg-orange-100' },
    'pdf': { label: 'PDF', color: 'text-red-700', bg: 'bg-red-100' },
    'xlsx': { label: 'XLSX', color: 'text-green-700', bg: 'bg-green-100' },
    'csv': { label: 'CSV', color: 'text-green-700', bg: 'bg-green-100' },
    'docx': { label: 'DOCX', color: 'text-blue-700', bg: 'bg-blue-100' },
  };
  return badges[ext || ''] || { label: ext?.toUpperCase() || 'FILE', color: 'text-slate-700', bg: 'bg-slate-100' };
}

export function RecentScansPage() {
  const { pastResults, setPastResults, setFindings, setScanPath } = useScanStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloadingVisualId, setDownloadingVisualId] = useState<string | null>(null);
  const [downloadingDetailedId, setDownloadingDetailedId] = useState<string | null>(null);
  const [visualError, setVisualError] = useState<string | null>(null);
  const [detailedError, setDetailedError] = useState<string | null>(null);

  useEffect(() => {
    loadResults();
  }, []);

  async function loadResults() {
    setLoading(true);
    setError('');

    try {
      const results = await backendApi.getResults();
      setPastResults(results);
    } catch (err: any) {
      setError(err.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  }

  function handleViewResult(result: PastResult) {
    setFindings(result.findings);
    setScanPath(result.filePath);
    window.location.href = '/backend-scan';
  }

  function downloadResult(result: PastResult) {
    const csvHeader = 'Element GUID,IFC Type,Issue,Severity,Discipline\n';
    const csvRows = result.findings.map(f =>
      `"${f.element_guid}","${f.ifc_type}","${f.issue}","${f.severity}","${f.discipline}"`
    ).join('\n');

    const csv = csvHeader + csvRows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scan-report-${result.fileName}-${new Date(result.timestamp).toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async function handleDownloadVisualPDF(scanId: string) {
    setDownloadingVisualId(scanId);
    setVisualError(null);

    try {
      const result = pastResults.find(r => r.id === scanId);
      if (!result) {
        throw new Error('Scan not found');
      }

      const { data: fileData, error: fileError } = await supabase
        .storage
        .from('construction-files')
        .download(result.filePath);

      if (fileError || !fileData) {
        throw new Error('Could not retrieve original file');
      }

      const blob = new Blob([fileData], { type: fileData.type || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const baseName = (result.fileName || 'file').replace(/\.[^/.]+$/, '');
      a.download = `${baseName}-original.${result.fileName?.split('.').pop() || 'ifc'}`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Failed to download visual PDF:', err);
      setVisualError(scanId);
    } finally {
      setDownloadingVisualId(null);
    }
  }

  async function handleDownloadDetailedPDF(result: PastResult) {
    setDownloadingDetailedId(result.id);
    setDetailedError(null);

    try {
      if (!result.fileName) {
        throw new Error('File name is missing');
      }

      const formattedFindings = (result.findings || []).map(f => ({
        id: `${result.id}-${f.element_guid}`,
        job_id: result.id,
        project_id: result.id,
        file_id: result.id,
        element_guid: f.element_guid,
        element_name: f.ifc_type || 'Unknown',
        title: f.issue,
        description: `${f.ifc_type} element has issue: ${f.issue}`,
        recommended_fix: 'Review element properties and verify against project requirements',
        severity: f.severity.toLowerCase() as any,
        discipline: f.discipline.toLowerCase() as any,
        rule_id: 'backend-rule',
        evidence: [],
        status: 'open' as any,
        created_at: result.timestamp,
        project: {
          id: result.id,
          name: result.fileName,
          client: 'N/A'
        }
      }));

      const baseName = result.fileName.replace(/\.[^/.]+$/, '');
      await downloadPDF({
        projectName: result.fileName,
        projectClient: 'DesignQA Scan',
        timestamp: result.timestamp,
        findings: formattedFindings,
      }, `${baseName}-detailed-report.pdf`);
    } catch (err: any) {
      console.error('Failed to download detailed PDF:', err);
      setDetailedError(result.id);
    } finally {
      setDownloadingDetailedId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg pt-20">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Loading recent scans...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg pt-20">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <a href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </a>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Recent Scans</h1>
          <p className="text-slate-600 mt-2">View your past scan results</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {pastResults.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Recent Scans</h3>
            <p className="text-slate-600 mb-6">You haven't run any scans yet</p>
            <a
              href="/backend-upload"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              Upload and Scan
            </a>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">File Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Timestamp</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Findings</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pastResults.map((result, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {result.fileName}
                            </div>
                            <div className="text-xs text-slate-500 font-mono">
                              {result.filePath.length > 40
                                ? `...${result.filePath.slice(-40)}`
                                : result.filePath}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock className="w-4 h-4" />
                          <div>
                            <div className="text-sm">
                              {new Date(result.timestamp).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-slate-500">
                              {new Date(result.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {result.findingsCount > 0 ? (
                            <>
                              <AlertCircle className="w-4 h-4 text-orange-600" />
                              <span className="text-sm font-medium text-slate-900">
                                {result.findingsCount} {result.findingsCount === 1 ? 'issue' : 'issues'}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-green-600 font-medium">
                              No issues
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleViewResult(result)}
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                          {result.findingsCount > 0 && (
                            <button
                              onClick={() => downloadResult(result)}
                              className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium text-sm"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {pastResults.length > 0 && (
          <>
            <div className="mt-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Visual PDF Reports</h2>
                <p className="text-slate-600">Download the original file with issue markups and annotations</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastResults.map((result, index) => (
                  <div
                    key={`visual-${index}`}
                    className="glass-card rounded-xl luxury-shadow p-6 hover:luxury-shadow-lg transition-all border-2 border-blue-100"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <h3 className="font-semibold text-slate-900 text-sm truncate">
                            {result.fileName}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          {(() => {
                            const badge = getFileTypeBadge(result.fileName);
                            return (
                              <span className={`px-2 py-0.5 ${badge.bg} ${badge.color} rounded text-xs font-semibold`}>
                                {badge.label}
                              </span>
                            );
                          })()}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          {new Date(result.timestamp).toLocaleDateString()} {new Date(result.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                        <FileText className="w-3 h-3" />
                        Visual
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Type</span>
                        <span className="font-semibold text-slate-900">Original File</span>
                      </div>
                      <div className="h-px bg-slate-200"></div>
                    </div>

                    <button
                      onClick={() => handleDownloadVisualPDF(result.id)}
                      disabled={downloadingVisualId === result.id}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
                        downloadingVisualId === result.id
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg'
                      }`}
                    >
                      {downloadingVisualId === result.id ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Download Original File
                        </>
                      )}
                    </button>

                    {visualError === result.id && (
                      <div className="mt-3 text-xs text-red-600 text-center">
                        Download failed. Please try again.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Detailed PDF Reports</h2>
                <p className="text-slate-600">Download comprehensive text reports with findings list and summaries</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastResults.map((result, index) => (
                  <div
                    key={`detailed-${index}`}
                    className="glass-card rounded-xl luxury-shadow p-6 hover:luxury-shadow-lg transition-all border-2 border-green-100"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileCheck className="w-5 h-5 text-green-600" />
                          <h3 className="font-semibold text-slate-900 text-sm truncate">
                            {result.fileName}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          {(() => {
                            const badge = getFileTypeBadge(result.fileName);
                            return (
                              <span className={`px-2 py-0.5 ${badge.bg} ${badge.color} rounded text-xs font-semibold`}>
                                {badge.label}
                              </span>
                            );
                          })()}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          {new Date(result.timestamp).toLocaleDateString()} {new Date(result.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">
                        <CheckCircle className="w-3 h-3" />
                        Ready
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Findings</span>
                        <span className="font-semibold text-slate-900">
                          {result.findingsCount === 0 ? '✅ No issues' : `${result.findingsCount} issue${result.findingsCount > 1 ? 's' : ''}`}
                        </span>
                      </div>
                      <div className="h-px bg-slate-200"></div>
                    </div>

                    <button
                      onClick={() => handleDownloadDetailedPDF(result)}
                      disabled={downloadingDetailedId === result.id}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
                        downloadingDetailedId === result.id
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg'
                      }`}
                    >
                      {downloadingDetailedId === result.id ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Generating report...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Download Detailed Report
                        </>
                      )}
                    </button>

                    {detailedError === result.id && (
                      <div className="mt-3 text-xs text-red-600 text-center">
                        Detailed report unavailable. Please try again.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">About Recent Scans</h3>
          <p className="text-sm text-blue-800">
            This page shows all your past scan results. Click "View" to see detailed findings or "Download" to export results as CSV.
            All scan data is securely stored in your Supabase database.
          </p>
        </div>
      </div>
    </div>
  );
}
