import { useEffect, useState } from 'react';
import { useParams } from '../lib/router';
import { api } from '../services/api';
import { ScanStatusResponse } from '../types';
import { ArrowLeft, CheckCircle, XCircle, Loader, ArrowRight, Zap } from 'lucide-react';

export function ScanStatusPage() {
  const params = useParams();
  const jobId = params.id;
  const [status, setStatus] = useState<ScanStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    if (!jobId) return;

    loadStatus();
    const interval = setInterval(loadStatus, 3000);

    return () => clearInterval(interval);
  }, [jobId]);

  async function loadStatus() {
    if (!jobId) return;
    try {
      const data = await api.scans.getStatus(jobId);
      setStatus(data);
      setLoading(false);

      if (data.status === 'completed' || data.status === 'failed') {
        clearInterval;
      }
    } catch (error) {
      console.error('Failed to load status:', error);
    }
  }

  async function handleSimulateComplete() {
    if (!jobId || simulating) return;

    setSimulating(true);
    try {
      await api.scans.complete(jobId);
      await loadStatus();
    } catch (error) {
      console.error('Failed to simulate completion:', error);
      alert('Failed to simulate scan completion');
    } finally {
      setSimulating(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  if (!status) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Scan not found</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <a href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </a>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Scan Status</h1>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              {status.status === 'running' && <Loader className="w-8 h-8 text-blue-600 animate-spin" />}
              {status.status === 'completed' && <CheckCircle className="w-8 h-8 text-green-600" />}
              {status.status === 'failed' && <XCircle className="w-8 h-8 text-red-600" />}
              {status.status === 'pending' && <Loader className="w-8 h-8 text-slate-400" />}

              <div>
                <p className="text-lg font-semibold text-slate-900 capitalize">{status.status}</p>
                <p className="text-sm text-slate-600">Job ID: {status.jobId}</p>
              </div>
            </div>

            {status.status === 'running' && (
              <div>
                <div className="flex justify-between text-sm text-slate-600 mb-2">
                  <span>Progress</span>
                  <span>{status.progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${status.progress}%` }}
                  />
                </div>
              </div>
            )}

            {status.errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {status.errorMessage}
              </div>
            )}

            {status.status === 'completed' && (
              <div>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-slate-600 mb-2">
                    <span>Progress</span>
                    <span>100%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
                <a
                  href={`/findings?jobId=${jobId}`}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                >
                  View Findings
                  <ArrowRight className="w-5 h-5" />
                </a>
              </div>
            )}

            {status.status !== 'completed' && (
              <button
                onClick={handleSimulateComplete}
                disabled={simulating}
                className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                {simulating ? 'Simulating...' : 'Simulate Scan Complete'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
