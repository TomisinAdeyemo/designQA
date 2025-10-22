import { useState, useRef, useEffect } from 'react';
import { Circle, Square, Type, ArrowRight, Undo, Download, Check, X } from 'lucide-react';
import { Annotation } from '../types';

interface DrawingMarkupEditorProps {
  drawingUrl: string;
  drawingName: string;
  onSave: (annotations: Annotation[], markedUpImageUrl: string) => void;
  onCancel: () => void;
  initialAnnotations?: Annotation[];
}

type ToolType = 'circle' | 'highlight' | 'arrow' | 'text';

export function DrawingMarkupEditor({
  drawingUrl,
  drawingName,
  onSave,
  onCancel,
  initialAnnotations = []
}: DrawingMarkupEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [activeTool, setActiveTool] = useState<ToolType>('circle');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
      redrawCanvas();
    };
    img.src = drawingUrl;
  }, [drawingUrl]);

  useEffect(() => {
    if (imageLoaded) {
      redrawCanvas();
    }
  }, [annotations, imageLoaded]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = imageRef.current;

    if (!canvas || !ctx || !img) return;

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.drawImage(img, 0, 0);

    annotations.forEach(annotation => {
      ctx.strokeStyle = annotation.color;
      ctx.fillStyle = annotation.color + '40';
      ctx.lineWidth = 4;

      const { x, y, width = 0, height = 0 } = annotation.coordinates;

      switch (annotation.type) {
        case 'circle':
          const radius = Math.sqrt(width * width + height * height) / 2;
          ctx.beginPath();
          ctx.arc(x + width / 2, y + height / 2, radius, 0, 2 * Math.PI);
          ctx.stroke();
          break;

        case 'highlight':
          ctx.fillRect(x, y, width, height);
          ctx.strokeRect(x, y, width, height);
          break;

        case 'arrow':
          drawArrow(ctx, x, y, x + width, y + height);
          break;

        case 'text':
          ctx.font = 'bold 24px Arial';
          ctx.fillStyle = annotation.color;
          ctx.fillText(annotation.label || '', x, y);
          break;
      }

      if (annotation.label && annotation.type !== 'text') {
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText(annotation.label, x, y - 10);
        ctx.fillText(annotation.label, x, y - 10);
      }
    });
  };

  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ) => {
    const headLength = 20;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.lineTo(toX, toY);
    ctx.fill();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * canvas.width) / rect.width;
    const y = ((e.clientY - rect.top) * canvas.height) / rect.height;

    setIsDrawing(true);
    setStartPoint({ x, y });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * canvas.width) / rect.width;
    const y = ((e.clientY - rect.top) * canvas.height) / rect.height;

    const width = x - startPoint.x;
    const height = y - startPoint.y;

    if (activeTool === 'text') {
      const label = prompt('Enter label text:');
      if (label) {
        addAnnotation(startPoint.x, startPoint.y, 0, 0, label);
      }
    } else {
      const label = prompt('Enter label (optional):') || `Issue ${annotations.length + 1}`;
      addAnnotation(startPoint.x, startPoint.y, width, height, label);
    }

    setIsDrawing(false);
    setStartPoint(null);
  };

  const addAnnotation = (x: number, y: number, width: number, height: number, label: string) => {
    const colors = {
      circle: '#ff0000',
      highlight: '#ffff00',
      arrow: '#ff6600',
      text: '#000000'
    };

    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: activeTool,
      coordinates: { x, y, width, height },
      color: colors[activeTool],
      label
    };

    setAnnotations([...annotations, newAnnotation]);
  };

  const handleUndo = () => {
    setAnnotations(annotations.slice(0, -1));
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    onSave(annotations, dataUrl);
  };

  const tools = [
    { type: 'circle' as ToolType, icon: Circle, label: 'Circle Issue', color: 'red' },
    { type: 'highlight' as ToolType, icon: Square, label: 'Highlight Area', color: 'yellow' },
    { type: 'arrow' as ToolType, icon: ArrowRight, label: 'Point Arrow', color: 'orange' },
    { type: 'text' as ToolType, icon: Type, label: 'Add Text', color: 'black' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl luxury-shadow-lg max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200/50 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Markup Drawing</h2>
            <p className="text-slate-600 mt-1">{drawingName}</p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        <div className="p-6 border-b border-slate-200/50 flex items-center gap-2 overflow-x-auto">
          {tools.map(tool => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.type}
                onClick={() => setActiveTool(tool.type)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                  activeTool === tool.type
                    ? `bg-${tool.color}-100 text-${tool.color}-700 ring-2 ring-${tool.color}-500`
                    : 'bg-white hover:bg-slate-50 text-slate-700'
                } shadow-md hover:shadow-lg`}
              >
                <Icon className="w-5 h-5" />
                <span className="whitespace-nowrap">{tool.label}</span>
              </button>
            );
          })}
          <div className="flex-1"></div>
          <button
            onClick={handleUndo}
            disabled={annotations.length === 0}
            className="flex items-center gap-2 px-4 py-3 rounded-xl font-semibold bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
          >
            <Undo className="w-5 h-5" />
            Undo
          </button>
        </div>

        <div className="flex-1 p-6 overflow-auto bg-slate-100">
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              className="max-w-full h-auto shadow-2xl cursor-crosshair border-4 border-white rounded-lg"
              style={{ maxHeight: 'calc(90vh - 300px)' }}
            />
          </div>
        </div>

        <div className="p-6 border-t border-slate-200/50 flex items-center justify-between bg-white">
          <div className="text-sm text-slate-600">
            <p className="font-semibold">Instructions:</p>
            <p>1. Select a tool above</p>
            <p>2. Click and drag on the drawing to mark issues</p>
            <p>3. Enter labels to identify specific problems</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-3 rounded-xl font-semibold bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-300 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="glow-button flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-xl shadow-green-600/30 hover:shadow-2xl hover:shadow-green-600/50 transition-all"
            >
              <Check className="w-5 h-5" />
              Save Markup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
