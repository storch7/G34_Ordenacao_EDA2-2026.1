import { useState } from 'react'
import { Header } from './components/Header'
import { FileUpload } from './components/FileUpload'
import './index.css'
import './App.css'

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile);
  };

  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        <FileUpload onFileSelect={handleFileSelect} isLoading={isLoading} />
        {/* Placeholder for results */}
      </main>
    </div>
  )
}

export default App
