import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { api } from '../services/api';
import { Project, DashboardStats, ScanJob } from '../types';
import { Navigation } from '../components/Navigation';
import { LayoutDashboard, FolderOpen, Activity, AlertTriangle, Plus, FileSearch } from 'lucide-react';

export function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentScans, setRecentScans] = useState<ScanJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsData, projectsData, scansData] = await Promise.all([
        api.dashboard.getStats(),
        api.projects.list(),
        api.scans.list(),
      ]);
      setStats(statsData);
      setProjects(projectsData.slice(0, 5));
      setRecentScans(scansData.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg pt-20">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Loading dashboard...</p>
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
            Dashboard
          </h1>
          <p className="text-slate-600 text-lg">
            Welcome back, {profile?.full_name || 'User'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<FolderOpen className="w-6 h-6" />}
            label="Total Projects"
            value={stats?.totalProjects || 0}
            color="blue"
          />
          <StatCard
            icon={<Activity className="w-6 h-6" />}
            label="Recent Scans"
            value={stats?.recentScans || 0}
            color="green"
          />
          <StatCard
            icon={<FileSearch className="w-6 h-6" />}
            label="Open Findings"
            value={stats?.openFindings || 0}
            color="amber"
          />
          <StatCard
            icon={<AlertTriangle className="w-6 h-6" />}
            label="Critical Issues"
            value={stats?.criticalFindings || 0}
            color="red"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl luxury-shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Recent Projects</h2>
              <a
                href="/projects/create"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New
              </a>
            </div>
            <div className="space-y-3">
              {projects.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No projects yet</p>
                </div>
              ) : (
                projects.map((project) => (
                  <a
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block p-4 bg-white/60 backdrop-blur-sm border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all"
                  >
                    <h3 className="font-semibold text-slate-900">{project.name}</h3>
                    <p className="text-sm text-slate-600 mt-1">{project.client}</p>
                  </a>
                ))
              )}
            </div>
          </div>

          <div className="glass-card rounded-2xl luxury-shadow p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Scans</h2>
            <div className="space-y-3">
              {recentScans.length === 0 ? (
                <p className="text-slate-500 text-sm">No scans yet</p>
              ) : (
                recentScans.map((scan) => (
                  <a
                    key={scan.id}
                    href={`/scans/${scan.id}`}
                    className="block p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(scan.status)}`}>
                            {scan.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                          {new Date(scan.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {scan.status === 'running' && (
                        <div className="text-sm font-medium text-blue-600">{scan.progress}%</div>
                      )}
                    </div>
                  </a>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  }[color];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className={`inline-flex p-3 rounded-lg ${colorClasses} mb-4`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-sm text-slate-600">{label}</div>
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-700';
    case 'running':
      return 'bg-blue-100 text-blue-700';
    case 'failed':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}
