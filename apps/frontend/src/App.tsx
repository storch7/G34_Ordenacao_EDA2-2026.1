import { useState } from 'react'
import { Header } from './components/Header'
import { FileUpload } from './components/FileUpload'
import { uploadAndAnalyzeLog, AnalyzeResult } from './services/api'
import './index.css'
import './App.css'

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (selectedFile: File | null) => {
    setFile(selectedFile);
    setError(null);
    setResult(null);

    if (selectedFile) {
      setIsLoading(true);
      try {
        const data = await uploadAndAnalyzeLog(selectedFile);
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setFile(null); // Reset selection on error
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        <FileUpload onFileSelect={handleFileSelect} isLoading={isLoading} />
        
        {error && (
          <div className="error-message glass-panel">
            <p>{error}</p>
          </div>
        )}

        {/* Placeholder for results */}
        {result && (
          <div className="results-placeholder glass-panel">
            <h2>Analysis Complete</h2>
            <p>Total Requests: {result.totalRequests.toLocaleString()}</p>
            <p>Processing Time: {result.processingTimeMs.toFixed(2)} ms</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
