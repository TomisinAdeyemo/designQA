import { useState } from 'react';
import { Building2, FileUp, ScanSearch, History, FileText, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../lib/auth';

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { signOut } = useAuth();

  const navItems = [
    { name: 'Projects', href: '/', icon: Building2 },
    { name: 'Upload', href: '/backend-upload', icon: FileUp },
    { name: 'Scan Results', href: '/findings', icon: ScanSearch },
    { name: 'Recent Scans', href: '/recent-scans', icon: History },
    { name: 'Reports', href: '/findings', icon: FileText },
  ];

  const currentPath = window.location.pathname;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-xl border-b border-white/20 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <a href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative bg-gradient-to-br from-blue-500 to-blue-700 p-3 rounded-xl shadow-lg transform group-hover:scale-110 transition-transform">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
              </div>
              <span className="text-2xl font-black bg-gradient-to-r from-slate-900 via-blue-800 to-slate-900 bg-clip-text text-transparent">
                DesignQA
              </span>
            </a>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="relative p-3 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 transition-all hover:scale-110 group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
              {mobileMenuOpen ? (
                <X className="relative w-6 h-6 text-slate-800" />
              ) : (
                <Menu className="relative w-6 h-6 text-slate-800" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 pt-20">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          ></div>

          <div className="relative max-w-md ml-auto h-full bg-gradient-to-br from-white via-blue-50 to-blue-100 shadow-2xl overflow-y-auto animate-slide-in">
            <div className="p-6 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.href;

                return (
                  <a
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`group relative flex items-center gap-4 px-6 py-4 rounded-xl font-semibold transition-all overflow-hidden ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/50'
                        : 'bg-white/60 backdrop-blur-sm text-slate-700 hover:bg-white hover:shadow-lg hover:scale-105'
                    }`}
                  >
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                      !isActive && 'bg-gradient-to-r from-blue-500/10 to-purple-500/10'
                    }`}></div>
                    <Icon className={`relative w-6 h-6 ${isActive ? 'text-white' : 'text-blue-600'}`} />
                    <span className="relative">{item.name}</span>
                    {isActive && (
                      <div className="absolute right-4 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    )}
                  </a>
                );
              })}

              <div className="pt-6 mt-6 border-t border-slate-300">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut();
                  }}
                  className="group relative w-full flex items-center gap-4 px-6 py-4 rounded-xl font-semibold text-red-600 bg-white/60 backdrop-blur-sm hover:bg-red-50 hover:shadow-lg hover:scale-105 transition-all overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <LogOut className="relative w-6 h-6" />
                  <span className="relative">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
