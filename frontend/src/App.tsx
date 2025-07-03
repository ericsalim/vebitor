import React, { useState } from 'react';
import './App.css';
import FileExplorer from './components/FileExplorer';
import TextEditor from './components/TextEditor';

interface OpenFile {
  filePath: string;
  dirty: boolean;
}

function App() {
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFile, setActiveFile] = useState<string>('');
  const [pendingClose, setPendingClose] = useState<null | { filePath: string }>(null);

  const handleFileSelect = (filePath: string) => {
    setOpenFiles((files) => {
      if (files.find((f) => f.filePath === filePath)) return files;
      return [...files, { filePath, dirty: false }];
    });
    setActiveFile(filePath);
  };

  const handleTabClick = (filePath: string) => {
    setActiveFile(filePath);
  };

  const handleTabClose = (e: React.MouseEvent, filePath: string) => {
    e.stopPropagation();
    const file = openFiles.find(f => f.filePath === filePath);
    if (file && file.dirty) {
      setPendingClose({ filePath });
    } else {
      actuallyCloseTab(filePath);
    }
  };

  const actuallyCloseTab = (filePath: string) => {
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
    setPendingClose(null);
  };

  const handleSave = (content: string) => {
    setOpenFiles((files) => files.map(f => f.filePath === activeFile ? { ...f, dirty: false } : f));
    console.log('File saved:', activeFile);
  };

  const handleLoad = (content: string) => {
    // Optionally update state or show notification
    console.log('File loaded:', activeFile);
  };

  const handleContentChange = (filePath: string) => {
    setOpenFiles((files) => files.map(f => f.filePath === filePath ? { ...f, dirty: true } : f));
  };

  // Prompt dialog handlers
  const handlePromptSave = () => {
    // Save, then close
    // We'll trigger save via a ref or by re-rendering TextEditor with a save prop
    // For now, just close and mark as not dirty
    if (pendingClose) {
      setOpenFiles((files) => files.map(f => f.filePath === pendingClose.filePath ? { ...f, dirty: false } : f));
      actuallyCloseTab(pendingClose.filePath);
    }
  };
  const handlePromptDontSave = () => {
    if (pendingClose) {
      actuallyCloseTab(pendingClose.filePath);
    }
  };
  const handlePromptCancel = () => {
    setPendingClose(null);
  };

  return (
    <div className="App">
      <main style={{ display: 'flex', height: '100vh' }}>
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
                <span style={{ marginRight: 8 }}>
                  {file.filePath}{file.dirty ? ' *' : ''}
                </span>
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
                key={activeFile}
                filePath={activeFile}
                onSave={handleSave}
                onLoad={handleLoad}
                onContentChange={handleContentChange}
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
          {pendingClose && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}>
              <div style={{ background: '#fff', padding: 24, borderRadius: 8, minWidth: 320, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                <div style={{ marginBottom: 16 }}>
                  <b>Save changes to {pendingClose.filePath}?</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button onClick={handlePromptSave}>Save</button>
                  <button onClick={handlePromptDontSave}>Don't Save</button>
                  <button onClick={handlePromptCancel}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
