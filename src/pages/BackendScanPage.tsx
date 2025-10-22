import { useState } from 'react';
import { backendApi, Finding } from '../services/backend-api';
import { useScanStore } from '../lib/scan-store';
import { Navigation } from '../components/Navigation';
import { ArrowLeft, PlayCircle, CheckCircle, AlertTriangle, XCircle, Loader, Download } from 'lucide-react';

export function BackendScanPage() {
  const { scanPath, uploadedFileName, findings, setFindings, addPastResult } = useScanStore();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');

  async function handleRunScan() {
    if (!scanPath) {
      setError('No file uploaded. Please upload a file first.');
      return;
    }

    setScanning(true);
    setError('');

    try {
      const response = await backendApi.runScan(scanPath);
      setFindings(response.findings);

      addPastResult({
        fileName: response.fileName || uploadedFileName || 'Unknown',
        timestamp: response.timestamp || new Date().toISOString(),
        findingsCount: response.findings.length,
        filePath: scanPath,
        findings: response.findings,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to run scan');
    } finally {
      setScanning(false);
    }
  }

  function getSeverityIcon(severity: string) {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'low':
        return <AlertTriangle className="w-5 h-5 text-blue-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-slate-600" />;
    }
  }

  function downloadReport() {
    const csvHeader = 'Element GUID,IFC Type,Issue,Severity,Discipline\n';
    const csvRows = findings.map(f =>
      `"${f.element_guid}","${f.ifc_type}","${f.issue}","${f.severity}","${f.discipline}"`
    ).join('\n');

    const csv = csvHeader + csvRows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scan-report-${uploadedFileName || 'results'}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  function getSeverityColor(severity: string) {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  }

  return (
    <div className="min-h-screen gradient-bg pt-20">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <a href="/backend-upload" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Upload
        </a>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Run Scan</h1>

          {uploadedFileName && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6">
              <p className="font-medium">Ready to scan: {uploadedFileName}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <button
            onClick={handleRunScan}
            disabled={scanning || !scanPath}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
          >
            {scanning ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <PlayCircle className="w-5 h-5" />
                Run Scan
              </>
            )}
          </button>
        </div>

        {findings.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Scan Results</h2>
                <p className="text-slate-600 mt-1">Found {findings.length} issues</p>
              </div>
              <button
                onClick={downloadReport}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Report
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Element GUID</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">IFC Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Issue</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Severity</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Discipline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {findings.map((finding, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <div className="font-mono text-xs text-slate-600">
                          {finding.element_guid}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-slate-900">
                          {finding.ifc_type}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-slate-900">
                          {finding.issue}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(finding.severity)}
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(
                              finding.severity
                            )}`}
                          >
                            {finding.severity}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-slate-700">
                          {finding.discipline}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : findings.length === 0 && !scanning && !error && scanPath ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No issues found</h3>
            <p className="text-slate-600">The scan completed successfully with no issues detected.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
