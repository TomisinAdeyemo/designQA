import { createContext, useContext, useState, ReactNode } from 'react';
import { Finding, PastResult } from '../services/backend-api';

interface ScanState {
  scanPath: string | null;
  uploadedFileName: string | null;
  findings: Finding[];
  pastResults: PastResult[];
  setScanPath: (path: string) => void;
  setUploadedFileName: (name: string) => void;
  setFindings: (findings: Finding[]) => void;
  setPastResults: (results: PastResult[]) => void;
  addPastResult: (result: PastResult) => void;
}

const ScanContext = createContext<ScanState | undefined>(undefined);

export function ScanProvider({ children }: { children: ReactNode }) {
  const [scanPath, setScanPath] = useState<string | null>(() => {
    return sessionStorage.getItem('scanPath');
  });
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(() => {
    return sessionStorage.getItem('uploadedFileName');
  });
  const [findings, setFindings] = useState<Finding[]>([]);
  const [pastResults, setPastResults] = useState<PastResult[]>([]);

  const handleSetScanPath = (path: string) => {
    setScanPath(path);
    sessionStorage.setItem('scanPath', path);
  };

  const handleSetUploadedFileName = (name: string) => {
    setUploadedFileName(name);
    sessionStorage.setItem('uploadedFileName', name);
  };

  const addPastResult = (result: PastResult) => {
    setPastResults((prev) => [result, ...prev]);
  };

  return (
    <ScanContext.Provider
      value={{
        scanPath,
        uploadedFileName,
        findings,
        pastResults,
        setScanPath: handleSetScanPath,
        setUploadedFileName: handleSetUploadedFileName,
        setFindings,
        setPastResults,
        addPastResult,
      }}
    >
      {children}
    </ScanContext.Provider>
  );
}

export function useScanStore() {
  const context = useContext(ScanContext);
  if (context === undefined) {
    throw new Error('useScanStore must be used within a ScanProvider');
  }
  return context;
}
