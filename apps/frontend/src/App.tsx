import { useState } from 'react'
import { Header } from './components/Header'
import { FileUpload } from './components/FileUpload'
import { ResultsDashboard } from './components/ResultsDashboard'
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

        {/* Results Dashboard */}
        {result && <ResultsDashboard result={result} />}
      </main>
    </div>
  )
}

export default App
