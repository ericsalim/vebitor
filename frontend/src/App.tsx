import React, { useState } from 'react';
import './App.css';
import FileExplorer from './components/FileExplorer';
import TextEditor from './components/TextEditor';

interface OpenFile {
  filePath: string;
}

function App() {
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFile, setActiveFile] = useState<string>('');

  const handleFileSelect = (filePath: string) => {
    setOpenFiles((files) => {
      if (files.find((f) => f.filePath === filePath)) return files;
      return [...files, { filePath }];
    });
    setActiveFile(filePath);
  };

  const handleTabClick = (filePath: string) => {
    setActiveFile(filePath);
  };

  const handleTabClose = (e: React.MouseEvent, filePath: string) => {
    e.stopPropagation();
    setOpenFiles((files) => files.filter((f) => f.filePath !== filePath));
    setTimeout(() => {
      setOpenFiles((files) => {
        if (files.length === 0) {
          setActiveFile('');
        } else if (activeFile === filePath) {
          setActiveFile(files[files.length - 1].filePath);
        }
        return files;
      });
    }, 0);
  };

  const handleSave = (content: string) => {
    console.log('File saved:', activeFile);
  };

  const handleLoad = (content: string) => {
    console.log('File loaded:', activeFile);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Web Text Editor</h1>
      </header>
      <main style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
        <FileExplorer
          onFileSelect={handleFileSelect}
          selectedFile={activeFile}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #ccc', background: '#f5f5f5', height: 36 }}>
            {openFiles.map((file) => (
              <div
                key={file.filePath}
                onClick={() => handleTabClick(file.filePath)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 16px',
                  cursor: 'pointer',
                  background: activeFile === file.filePath ? '#fff' : 'transparent',
                  borderTop: activeFile === file.filePath ? '2px solid #0078d4' : '2px solid transparent',
                  borderRight: '1px solid #ccc',
                  height: '100%',
                  position: 'relative',
                  fontWeight: activeFile === file.filePath ? 'bold' : 'normal',
                  color: '#222',
                  userSelect: 'none',
                }}
              >
                <span style={{ marginRight: 8 }}>{file.filePath}</span>
                <span
                  onClick={(e) => handleTabClose(e, file.filePath)}
                  style={{ color: '#888', marginLeft: 4, cursor: 'pointer', fontWeight: 'normal' }}
                  title="Close tab"
                >
                  ×
                </span>
              </div>
            ))}
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            {activeFile ? (
              <TextEditor
                filePath={activeFile}
                onSave={handleSave}
                onLoad={handleLoad}
              />
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#666',
              }}>
                Select a file from the explorer to start editing
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
