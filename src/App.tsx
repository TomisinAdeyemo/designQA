import { useEffect, useState } from 'react';
import { useAuth, AuthProvider } from './lib/auth';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { Dashboard } from './pages/Dashboard';
import { ProjectDetail } from './pages/ProjectDetail';
import { CreateProjectPage } from './pages/CreateProjectPage';
import { FileUploadPage } from './pages/FileUploadPage';
import { CreateScanPage } from './pages/CreateScanPage';
import { ScanStatusPage } from './pages/ScanStatusPage';
import { PremiumFindingsPage } from './pages/PremiumFindingsPage';
import { FindingDetailPage } from './pages/FindingDetailPage';
import { RuleSetManagerPage } from './pages/RuleSetManagerPage';
import { AdminIntegrationsPage } from './pages/AdminIntegrationsPage';
import { CollectorsPage } from './pages/CollectorsPage';
import { BackendUploadPage } from './pages/BackendUploadPage';
import { BackendScanPage } from './pages/BackendScanPage';
import { RecentScansPage } from './pages/RecentScansPage';
import { ScanProvider } from './lib/scan-store';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
   if (currentPath === '/signup' || currentPath === '/designQA/signup') {
  return <SignUp />;
}
    return <SignIn />;
  }

  const renderPage = () => {
    if (currentPath === '/') {
      return <Dashboard />;
    } else if (currentPath === '/projects/create') {
      return <CreateProjectPage />;
    } else if (currentPath.startsWith('/projects/') && currentPath.endsWith('/upload')) {
      return <FileUploadPage />;
    } else if (currentPath.startsWith('/projects/')) {
      return <ProjectDetail />;
    } else if (currentPath.startsWith('/scans/create')) {
      return <CreateScanPage />;
    } else if (currentPath.startsWith('/scans/')) {
      return <ScanStatusPage />;
    } else if (currentPath === '/collectors') {
      return <CollectorsPage />;
    } else if (currentPath === '/backend-upload') {
      return <BackendUploadPage />;
    } else if (currentPath === '/backend-scan') {
      return <BackendScanPage />;
    } else if (currentPath === '/recent-scans') {
      return <RecentScansPage />;
    } else if (currentPath === '/findings') {
      return <PremiumFindingsPage />;
    } else if (currentPath.startsWith('/findings/')) {
      return <FindingDetailPage />;
    } else if (currentPath === '/rulesets') {
      return <RuleSetManagerPage />;
    } else if (currentPath === '/admin') {
      return <AdminIntegrationsPage />;
    }
    return <Dashboard />;
  };

  return renderPage();
}

export default function App() {
  return (
    <AuthProvider>
      <ScanProvider>
        <AppContent />
      </ScanProvider>
    </AuthProvider>
  );
}
