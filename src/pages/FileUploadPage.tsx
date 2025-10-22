import { useState } from 'react';
import { useParams } from '../lib/router';
import { api } from '../services/api';
import { FileUpload } from '../components/FileUpload';
import { ArrowLeft, Upload as UploadIcon } from 'lucide-react';

export function FileUploadPage() {
  const params = useParams();
  const projectId = params.id;
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleUpload() {
    if (!file || !projectId) return;

    setUploading(true);
    setError('');

    try {
      const uploadResponse = await api.files.requestUpload({
        filename: file.name,
        contentType: file.type,
        projectId,
      });

      window.location.href = `/projects/${projectId}`;
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <a href={`/projects/${projectId}`} className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Project
        </a>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Upload File</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <FileUpload
            onFileSelect={setFile}
            accept=".ifc,.rvt,.dwg,.pdf"
          />

          {file && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              <UploadIcon className="w-5 h-5" />
              {uploading ? 'Uploading...' : 'Upload File'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
