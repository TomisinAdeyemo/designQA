import { useEffect, useState } from 'react';
import { useParams } from '../lib/router';
import { api } from '../services/api';
import { Finding, Annotation } from '../types';
import { ArrowLeft, AlertCircle, Plus, Upload, Image as ImageIcon } from 'lucide-react';
import { RFIFormModal } from '../components/RFIFormModal';
import { DrawingMarkupEditor } from '../components/DrawingMarkupEditor';
import { Navigation } from '../components/Navigation';

export function FindingDetailPage() {
  const params = useParams();
  const findingId = params.id;
  const [finding, setFinding] = useState<Finding | null>(null);
  const [showRFIModal, setShowRFIModal] = useState(false);
  const [showMarkupEditor, setShowMarkupEditor] = useState(false);
  const [selectedDrawing, setSelectedDrawing] = useState<{ url: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (findingId) loadFinding();
  }, [findingId]);

  async function loadFinding() {
    if (!findingId) return;
    try {
      const data = await api.findings.get(findingId);
      setFinding(data);
    } catch (error) {
      console.error('Failed to load finding:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleDrawingUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setSelectedDrawing({ url, name: file.name });
      setShowMarkupEditor(true);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveMarkup = async (annotations: Annotation[], markedUpImageUrl: string) => {
    if (!finding || !selectedDrawing) return;

    const newEvidence = [
      ...(finding.evidence || []),
      {
        type: 'drawing_markup' as const,
        url: markedUpImageUrl,
        caption: `Marked up: ${selectedDrawing.name}`,
        markup: {
          drawingUrl: selectedDrawing.url,
          drawingName: selectedDrawing.name,
          annotations,
          timestamp: new Date().toISOString()
        }
      }
    ];

    try {
      const updatedFinding = await api.findings.updateEvidence(finding.id, newEvidence);
      setFinding(updatedFinding);
      setShowMarkupEditor(false);
      setSelectedDrawing(null);
    } catch (error) {
      console.error('Failed to save markup:', error);
      alert('Failed to save marked-up drawing. Please try again.');
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen gradient-bg pt-20 flex items-center justify-center">
          <div className="glass-card rounded-2xl p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </>
    );
  }

  if (!finding) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen gradient-bg pt-20 flex items-center justify-center">
          <div className="glass-card rounded-2xl p-8">
            <p className="text-slate-900 font-semibold">Finding not found</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen gradient-bg pt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <a href="/findings" className="inline-flex items-center gap-2 text-slate-800 hover:text-slate-900 mb-6 font-semibold">
            <ArrowLeft className="w-5 h-5" />
            Back to Findings
          </a>

          <div className="glass-card rounded-2xl luxury-shadow-lg p-8 mb-6">
            <div className="flex items-start gap-4 mb-6">
              <div className={`p-3 rounded-xl ${getSeverityColor(finding.severity)} shadow-lg`}>
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-slate-900 mb-3">{finding.title}</h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-4 py-2 rounded-xl text-sm font-bold ${getSeverityBadge(finding.severity)} shadow-md`}>
                    {finding.severity.toUpperCase()}
                  </span>
                  <span className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-200 text-slate-800 shadow-md">
                    {finding.discipline.toUpperCase()}
                  </span>
                  <span className="px-4 py-2 rounded-xl text-sm font-bold bg-blue-200 text-blue-800 shadow-md">
                    {finding.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-white/50 rounded-xl">
                <h2 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Description</h2>
                <p className="text-slate-900 text-lg">{finding.description}</p>
              </div>

              {finding.element_name && (
                <div className="p-4 bg-white/50 rounded-xl">
                  <h2 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">BIM Element</h2>
                  <p className="text-slate-900 font-semibold text-lg">{finding.element_name}</p>
                  {finding.element_guid && (
                    <p className="text-sm text-slate-600 mt-1 font-mono">GUID: {finding.element_guid}</p>
                  )}
                </div>
              )}

              {finding.rule_id && (
                <div className="p-4 bg-white/50 rounded-xl">
                  <h2 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Rule ID</h2>
                  <p className="text-slate-900 font-mono">{finding.rule_id}</p>
                </div>
              )}
            </div>
          </div>

          <div className="glass-card rounded-2xl luxury-shadow-lg p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Visual Evidence & Drawings</h2>
              <label className="glow-button flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-xl shadow-blue-600/30 hover:shadow-2xl hover:shadow-blue-600/50 transition-all cursor-pointer">
                <Upload className="w-5 h-5" />
                Upload & Markup Drawing
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleDrawingUpload}
                  className="hidden"
                />
              </label>
            </div>

            {finding.evidence && finding.evidence.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {finding.evidence.map((evidence, index) => (
                  <div key={index} className="interactive-card bg-white rounded-xl overflow-hidden shadow-lg">
                    {evidence.type === 'drawing_markup' && evidence.url ? (
                      <div>
                        <div className="relative">
                          <img
                            src={evidence.url}
                            alt={evidence.caption || `Marked up drawing ${index + 1}`}
                            className="w-full h-auto"
                          />
                          <div className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                            MARKED UP
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="font-semibold text-slate-900">{evidence.caption}</p>
                          {evidence.markup && (
                            <p className="text-sm text-slate-600 mt-1">
                              {evidence.markup.annotations.length} annotation(s) - {new Date(evidence.markup.timestamp).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : evidence.url ? (
                      <div>
                        <img
                          src={evidence.url}
                          alt={evidence.caption || `Evidence ${index + 1}`}
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-4">
                          <p className="text-sm text-slate-700">{evidence.caption || `Evidence ${index + 1}`}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6">
                        <p className="text-sm text-slate-700">{evidence.caption || `Evidence ${index + 1}`}</p>
                        {evidence.data && (
                          <pre className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded overflow-auto">
                            {JSON.stringify(evidence.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white/50 rounded-xl">
                <ImageIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 font-semibold mb-2">No visual evidence yet</p>
                <p className="text-slate-500 text-sm">Upload a drawing and mark up the specific issue location</p>
              </div>
            )}
          </div>

          <div className="glass-card rounded-2xl luxury-shadow-lg p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Actions</h2>
            <button
              onClick={() => setShowRFIModal(true)}
              className="glow-button flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-xl shadow-green-600/30 hover:shadow-2xl hover:shadow-green-600/50 transition-all"
            >
              <Plus className="w-5 h-5" />
              Create RFI from Finding
            </button>
          </div>
        </div>
      </div>

      {showRFIModal && (
        <RFIFormModal
          finding={finding}
          onClose={() => setShowRFIModal(false)}
          onSuccess={() => {
            setShowRFIModal(false);
          }}
        />
      )}

      {showMarkupEditor && selectedDrawing && (
        <DrawingMarkupEditor
          drawingUrl={selectedDrawing.url}
          drawingName={selectedDrawing.name}
          onSave={handleSaveMarkup}
          onCancel={() => {
            setShowMarkupEditor(false);
            setSelectedDrawing(null);
          }}
        />
      )}
    </>
  );
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'bg-gradient-to-br from-red-500 to-red-700 text-white';
    case 'high':
      return 'bg-gradient-to-br from-orange-500 to-orange-700 text-white';
    case 'medium':
      return 'bg-gradient-to-br from-amber-500 to-amber-700 text-white';
    case 'low':
      return 'bg-gradient-to-br from-yellow-500 to-yellow-700 text-white';
    default:
      return 'bg-gradient-to-br from-slate-500 to-slate-700 text-white';
  }
}

function getSeverityBadge(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-200 text-red-900';
    case 'high':
      return 'bg-orange-200 text-orange-900';
    case 'medium':
      return 'bg-amber-200 text-amber-900';
    case 'low':
      return 'bg-yellow-200 text-yellow-900';
    default:
      return 'bg-slate-200 text-slate-900';
  }
}
