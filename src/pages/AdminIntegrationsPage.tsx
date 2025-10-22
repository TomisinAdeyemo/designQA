import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Webhook, EnvironmentVariable, UserProfile } from '../types';
import { Plus, Trash2, Power, PowerOff, Save, Key, Users, Webhook as WebhookIcon } from 'lucide-react';

export function AdminIntegrationsPage() {
  const [activeTab, setActiveTab] = useState<'webhooks' | 'services' | 'users'>('webhooks');

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Admin & Integrations</h1>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('webhooks')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition ${
                  activeTab === 'webhooks'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <WebhookIcon className="w-5 h-5" />
                Webhooks
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition ${
                  activeTab === 'services'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Key className="w-5 h-5" />
                External Services
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition ${
                  activeTab === 'users'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-5 h-5" />
                Team Members
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'webhooks' && <WebhooksSection />}
            {activeTab === 'services' && <ExternalServicesSection />}
            {activeTab === 'users' && <TeamMembersSection />}
          </div>
        </div>
      </div>
    </div>
  );
}

function WebhooksSection() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [url, setUrl] = useState('');
  const [eventType, setEventType] = useState('scan.completed');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadWebhooks();
  }, []);

  async function loadWebhooks() {
    try {
      const data = await api.webhooks.list();
      setWebhooks(data);
    } catch (error) {
      console.error('Failed to load webhooks:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!url) return;

    setSubmitting(true);
    try {
      await api.webhooks.create(url, eventType);
      setUrl('');
      setEventType('scan.completed');
      setShowModal(false);
      loadWebhooks();
    } catch (error) {
      console.error('Failed to create webhook:', error);
      alert('Failed to create webhook');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      await api.webhooks.delete(id);
      loadWebhooks();
    } catch (error) {
      console.error('Failed to delete webhook:', error);
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    try {
      await api.webhooks.toggle(id, !isActive);
      loadWebhooks();
    } catch (error) {
      console.error('Failed to toggle webhook:', error);
    }
  }

  if (loading) {
    return <div className="text-slate-600">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Webhooks</h2>
          <p className="text-sm text-slate-600 mt-1">Receive notifications when events occur</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          Add Webhook
        </button>
      </div>

      {webhooks.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <WebhookIcon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p>No webhooks configured</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-700">URL</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Event Type</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Created</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {webhooks.map((webhook) => (
                <tr key={webhook.id} className="border-b border-slate-100">
                  <td className="py-3 px-4 font-mono text-sm">{webhook.url}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                      {webhook.event_type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        webhook.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {webhook.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600">
                    {new Date(webhook.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggle(webhook.id, webhook.is_active)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                        title={webhook.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {webhook.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(webhook.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Add Webhook</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://your-server.com/webhook"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Event Type
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="scan.completed">Scan Completed</option>
                  <option value="scan.failed">Scan Failed</option>
                  <option value="finding.created">Finding Created</option>
                  <option value="issue.created">Issue Created</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting || !url}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold rounded-lg transition"
              >
                {submitting ? 'Creating...' : 'Create Webhook'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExternalServicesSection() {
  const [variables, setVariables] = useState<EnvironmentVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [awsAccessKey, setAwsAccessKey] = useState('');
  const [awsSecret, setAwsSecret] = useState('');
  const [awsRegion, setAwsRegion] = useState('');
  const [s3Bucket, setS3Bucket] = useState('');

  useEffect(() => {
    loadVariables();
  }, []);

  async function loadVariables() {
    try {
      const data = await api.environmentVariables.list();
      setVariables(data);

      const awsKey = data.find(v => v.key === 'AWS_ACCESS_KEY');
      const awsSecretVar = data.find(v => v.key === 'AWS_SECRET');
      const region = data.find(v => v.key === 'AWS_REGION');
      const bucket = data.find(v => v.key === 'S3_BUCKET');

      if (awsKey) setAwsAccessKey(awsKey.value);
      if (awsSecretVar) setAwsSecret(awsSecretVar.value);
      if (region) setAwsRegion(region.value);
      if (bucket) setS3Bucket(bucket.value);
    } catch (error) {
      console.error('Failed to load variables:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await Promise.all([
        api.environmentVariables.upsert('AWS_ACCESS_KEY', awsAccessKey, 'AWS Access Key ID'),
        api.environmentVariables.upsert('AWS_SECRET', awsSecret, 'AWS Secret Access Key'),
        api.environmentVariables.upsert('AWS_REGION', awsRegion, 'AWS Region'),
        api.environmentVariables.upsert('S3_BUCKET', s3Bucket, 'S3 Bucket Name'),
      ]);
      alert('Configuration saved successfully');
      loadVariables();
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-slate-600">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">AWS S3 Configuration</h2>
        <p className="text-sm text-slate-600 mt-1">Configure AWS credentials for file storage</p>
      </div>

      <div className="space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            AWS Access Key ID
          </label>
          <input
            type="text"
            value={awsAccessKey}
            onChange={(e) => setAwsAccessKey(e.target.value)}
            placeholder="AKIA..."
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            AWS Secret Access Key
          </label>
          <input
            type="password"
            value={awsSecret}
            onChange={(e) => setAwsSecret(e.target.value)}
            placeholder="••••••••••••••••••••"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            AWS Region
          </label>
          <input
            type="text"
            value={awsRegion}
            onChange={(e) => setAwsRegion(e.target.value)}
            placeholder="us-east-1"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            S3 Bucket Name
          </label>
          <input
            type="text"
            value={s3Bucket}
            onChange={(e) => setS3Bucket(e.target.value)}
            placeholder="constructqa-files"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}

function TeamMembersSection() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const data = await api.users.list();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    try {
      await api.users.updateRole(userId, newRole);
      loadUsers();
    } catch (error) {
      console.error('Failed to update role:', error);
      alert('Failed to update user role');
    }
  }

  if (loading) {
    return <div className="text-slate-600">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Team Members</h2>
          <p className="text-sm text-slate-600 mt-1">Manage team member roles and permissions</p>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p>No team members found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Role</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-700">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100">
                  <td className="py-3 px-4 font-medium text-slate-900">{user.full_name}</td>
                  <td className="py-3 px-4 text-slate-600">{user.email}</td>
                  <td className="py-3 px-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="px-3 py-1 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="reviewer">Reviewer</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
