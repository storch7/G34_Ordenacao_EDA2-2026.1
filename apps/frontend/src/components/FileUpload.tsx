import { useState, useRef } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';
import './FileUpload.css';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  isLoading: boolean;
}

export function FileUpload({ onFileSelect, isLoading }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileChange(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleFileChange = (file: File) => {
    // Check if it's a valid extension
    if (file.name.endsWith('.log') || file.name.endsWith('.txt')) {
      setSelectedFile(file);
      onFileSelect(file);
    } else {
      alert("Please upload a .log or .txt file.");
    }
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="upload-container">
      <div 
        className={`upload-zone glass-panel ${isDragging ? 'dragging' : ''} ${isLoading ? 'disabled' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleChange} 
          accept=".log,.txt" 
          style={{ display: 'none' }} 
          disabled={isLoading}
        />
        
        {!selectedFile ? (
          <div className="upload-prompt">
            <div className="upload-icon">
              <UploadCloud size={40} />
            </div>
            <h3>Drag & Drop your log file here</h3>
            <p>or click to browse (.log or .txt)</p>
          </div>
        ) : (
          <div className="file-selected">
            <div className="file-info">
              <FileText size={24} className="file-icon" />
              <div className="file-details">
                <span className="file-name">{selectedFile.name}</span>
                <span className="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            </div>
            {!isLoading && (
              <button className="clear-btn" onClick={clearSelection} title="Remove file">
                <X size={20} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
