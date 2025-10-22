import { useState } from 'react';
import { api } from '../services/api';
import { ArrowLeft, FolderPlus } from 'lucide-react';

export function CreateProjectPage() {
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !client.trim()) {
      setError('Name and client are required');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const project = await api.projects.create(name, client);
      window.location.href = `/projects/${project.id}`;
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <a href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </a>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-lg">
              <FolderPlus className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Create New Project</h1>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                Project Name *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g., Downtown Office Building"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="client" className="block text-sm font-medium text-slate-700 mb-2">
                Client Name *
              </label>
              <input
                id="client"
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                required
                placeholder="e.g., ABC Construction Company"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={creating}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
              >
                <FolderPlus className="w-5 h-5" />
                {creating ? 'Creating Project...' : 'Create Project'}
              </button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Next steps:</strong> After creating the project, you'll be able to upload files and run quality assurance scans.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
