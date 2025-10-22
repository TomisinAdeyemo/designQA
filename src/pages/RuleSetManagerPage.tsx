import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { RuleSet } from '../types';
import { Plus, Settings, Trash2 } from 'lucide-react';

export function RuleSetManagerPage() {
  const [ruleSets, setRuleSets] = useState<RuleSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [jsonContent, setJsonContent] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newJsonContent, setNewJsonContent] = useState('[]');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadRuleSets();
  }, []);

  async function loadRuleSets() {
    try {
      const data = await api.ruleSets.list();
      setRuleSets(data);
    } catch (error) {
      console.error('Failed to load rule sets:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(ruleSet: RuleSet) {
    setEditingId(ruleSet.id);
    setJsonContent(JSON.stringify(ruleSet.rules_json, null, 2));
  }

  async function handleSave() {
    if (!editingId) return;

    try {
      const parsed = JSON.parse(jsonContent);
      await api.ruleSets.update(editingId, { rules_json: parsed });
      setEditingId(null);
      loadRuleSets();
    } catch (error) {
      console.error('Failed to save rule set:', error);
      alert('Invalid JSON or save failed');
    }
  }

  async function handleCreate() {
    if (!newName.trim()) {
      alert('Name is required');
      return;
    }

    setCreating(true);
    try {
      const parsed = JSON.parse(newJsonContent);
      await api.ruleSets.create(newName, newDescription, parsed);
      setShowNewModal(false);
      setNewName('');
      setNewDescription('');
      setNewJsonContent('[]');
      loadRuleSets();
    } catch (error) {
      console.error('Failed to create rule set:', error);
      alert('Invalid JSON or creation failed');
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Rule Set Manager</h1>
          <button
            onClick={() => setShowNewModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            New Rule Set
          </button>
        </div>

        <div className="space-y-4">
          {ruleSets.map((ruleSet) => (
            <div key={ruleSet.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              {editingId === ruleSet.id ? (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">{ruleSet.name}</h3>
                  <textarea
                    value={jsonContent}
                    onChange={(e) => setJsonContent(e.target.value)}
                    className="w-full h-96 px-4 py-3 border border-slate-300 rounded-lg font-mono text-sm"
                  />
                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-lg">{ruleSet.name}</h3>
                    <p className="text-slate-600 mt-1">{ruleSet.description}</p>
                    <p className="text-sm text-slate-500 mt-2">
                      {Array.isArray(ruleSet.rules_json) ? ruleSet.rules_json.length : 0} rules
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(ruleSet)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {showNewModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">Create New Rule Set</h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="My Rule Set"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Description of this rule set"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Rules JSON
                  </label>
                  <textarea
                    value={newJsonContent}
                    onChange={(e) => setNewJsonContent(e.target.value)}
                    className="w-full h-96 px-4 py-3 border border-slate-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder='[{"id": "RULE-001", "name": "Rule Name", "description": "...", "severity": "high", "discipline": "general", "parameters": {}}]'
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Enter a valid JSON array of rules
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 flex gap-3">
                <button
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold rounded-lg transition"
                >
                  {creating ? 'Creating...' : 'Create Rule Set'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
