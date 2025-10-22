import { useState } from 'react';
import { backendApi } from '../services/backend-api';
import { useScanStore } from '../lib/scan-store';
import { FileUpload } from '../components/FileUpload';
import { Navigation } from '../components/Navigation';
import { ArrowLeft, Upload as UploadIcon, CheckCircle, ArrowRight } from 'lucide-react';

export function BackendUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { setScanPath, setUploadedFileName, uploadedFileName } = useScanStore();

  async function handleUpload() {
    if (!file) return;

    setUploading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await backendApi.uploadFile(file);
      setScanPath(response.savedPath);
      setUploadedFileName(response.originalName);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen gradient-bg pt-20">
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <a href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </a>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Upload File for Scanning</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {success && uploadedFileName && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Uploaded: {uploadedFileName}</span>
            </div>
          )}

          <FileUpload
            onFileSelect={setFile}
            accept=".ifc,.rvt,.dwg,.pdf"
          />

          {file && !success && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              <UploadIcon className="w-5 h-5" />
              {uploading ? 'Uploading...' : 'Upload File'}
            </button>
          )}

          {success && (
            <a
              href="/backend-scan"
              className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              Proceed to Scan
              <ArrowRight className="w-5 h-5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
