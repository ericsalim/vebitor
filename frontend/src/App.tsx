import React, { useState } from 'react';
import './App.css';
import FileExplorer from './components/FileExplorer';
import TextEditor from './components/TextEditor';

function App() {
  const [selectedFile, setSelectedFile] = useState<string>('');

  const handleFileSelect = (filePath: string) => {
    setSelectedFile(filePath);
  };

  const handleSave = (content: string) => {
    console.log('File saved:', selectedFile);
  };

  const handleLoad = (content: string) => {
    console.log('File loaded:', selectedFile);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Web Text Editor</h1>
      </header>
      <main style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
        <FileExplorer
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
        />
        <div style={{ flex: 1 }}>
          {selectedFile ? (
            <TextEditor
              filePath={selectedFile}
              onSave={handleSave}
              onLoad={handleLoad}
            />
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: '#666'
            }}>
              Select a file from the explorer to start editing
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
