import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { RuleSet, File, Project } from '../types';
import { ArrowLeft, Play } from 'lucide-react';

export function CreateScanPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [ruleSets, setRuleSets] = useState<RuleSet[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedFileId, setSelectedFileId] = useState('');
  const [selectedRuleSetId, setSelectedRuleSetId] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadFiles(selectedProjectId);
    } else {
      setFiles([]);
      setSelectedFileId('');
    }
  }, [selectedProjectId]);

  async function loadData() {
    try {
      const [projectsData, rulesData] = await Promise.all([
        api.projects.list(),
        api.ruleSets.list(),
      ]);
      setProjects(projectsData);
      setRuleSets(rulesData);

      if (projectsData.length > 0) {
        setSelectedProjectId(projectsData[0].id);
      }
      if (rulesData.length > 0) {
        setSelectedRuleSetId(rulesData[0].id);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadFiles(projectId: string) {
    try {
      const filesData = await api.files.list(projectId);
      setFiles(filesData);
      if (filesData.length > 0) {
        setSelectedFileId(filesData[0].id);
      } else {
        setSelectedFileId('');
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  }

  async function handleCreateScan() {
    if (!selectedFileId || !selectedRuleSetId) return;

    setCreating(true);
    setError('');

    try {
      const file = files.find(f => f.id === selectedFileId);
      if (!file) throw new Error('File not found');

      const response = await api.scans.create({
        projectId: file.project_id,
        fileId: selectedFileId,
        ruleSetId: selectedRuleSetId,
      });

      window.location.href = `/findings?jobId=${response.jobId}`;
    } catch (err: any) {
      setError(err.message || 'Failed to create scan');
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <a href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </a>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Create Scan</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Project
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {projects.length === 0 ? (
                  <option value="">No projects available</option>
                ) : (
                  projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} - {project.client}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select File
              </label>
              <select
                value={selectedFileId}
                onChange={(e) => setSelectedFileId(e.target.value)}
                disabled={!selectedProjectId}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100"
              >
                {files.length === 0 ? (
                  <option value="">No files available in this project</option>
                ) : (
                  files.map((file) => (
                    <option key={file.id} value={file.id}>
                      {file.filename} (v{file.version})
                    </option>
                  ))
                )}
              </select>
              {selectedProjectId && files.length === 0 && (
                <p className="text-sm text-slate-500 mt-2">
                  No files uploaded yet.{' '}
                  <a href={`/projects/${selectedProjectId}/upload`} className="text-blue-600 hover:underline">
                    Upload a file first
                  </a>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Rule Set
              </label>
              <select
                value={selectedRuleSetId}
                onChange={(e) => setSelectedRuleSetId(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {ruleSets.length === 0 ? (
                  <option value="">No rule sets available</option>
                ) : (
                  ruleSets.map((ruleSet) => (
                    <option key={ruleSet.id} value={ruleSet.id}>
                      {ruleSet.name} - {ruleSet.description}
                    </option>
                  ))
                )}
              </select>
            </div>

            <button
              onClick={handleCreateScan}
              disabled={creating || !selectedFileId || !selectedRuleSetId}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              {creating ? 'Creating Scan...' : 'Run Scan Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
