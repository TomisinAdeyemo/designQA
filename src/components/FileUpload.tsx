import { useState, useCallback } from 'react';
import { Upload, X } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
}

export function FileUpload({ onFileSelect, accept }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleRemove = useCallback(() => {
    setSelectedFile(null);
  }, []);

  return (
    <div>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-slate-300 bg-slate-50 hover:border-slate-400'
        }`}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={handleChange}
          accept={accept}
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          <Upload className="w-12 h-12 text-slate-400 mb-4" />
          <p className="text-lg font-medium text-slate-700 mb-2">
            Drop files here or click to upload
          </p>
          <p className="text-sm text-slate-500">
            {accept ? `Supported formats: ${accept}` : 'Any file type supported'}
          </p>
        </label>
      </div>

      {selectedFile && (
        <div className="mt-4 p-4 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-900">{selectedFile.name}</p>
            <p className="text-sm text-slate-600">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button
            onClick={handleRemove}
            className="text-slate-400 hover:text-red-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
