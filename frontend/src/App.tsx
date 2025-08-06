import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import FileExplorer from './components/FileExplorer';
import TextEditor, { TextEditorHandle } from './components/TextEditor';
import SearchPanel from './components/SearchPanel';
import MenuBar from "./components/MenuBar";
import { documentsApi } from './api/documents';

interface OpenFile {
  filePath: string;
  dirty: boolean;
}

function App() {
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFile, setActiveFile] = useState<string>('');
  const [pendingClose, setPendingClose] = useState<null | { filePath: string }>(null);

  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [currentFolder, setCurrentFolder] = useState('');
  const [refreshSignal, setRefreshSignal] = useState(0);

  // Refs for TextEditors
  const editorRefs = useRef<{ [filePath: string]: React.RefObject<TextEditorHandle | null> }>({});

  // Helper to update session
  const updateSession = (openedFiles: OpenFile[], lastActiveFile: string, workingFolder?: string) => {
    fetch('/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        openedFiles: openedFiles.map(f => f.filePath),
        lastActiveFile,
        workingFolder: workingFolder !== undefined ? workingFolder : currentFolder,
      })
    }).catch(err => console.error('Session save error:', err));
  };

  const handleFileSelect = (filePath: string) => {
    setOpenFiles((files) => {
      if (files.find((f) => f.filePath === filePath)) return files;
      const updated = [...files, { filePath, dirty: false }];
      updateSession(updated, filePath);
      return updated;
    });
    setActiveFile(filePath);
    // Also update session if file is already open and just focused
    if (openFiles.find(f => f.filePath === filePath)) {
      updateSession(openFiles, filePath);
    }
  };

  // User-initiated folder change handler
  const handleUserFolderChange = (folderPath: string) => {
    setCurrentFolder(folderPath);
    updateSession(openFiles, activeFile, folderPath);
  };

  // For compatibility, keep handleFolderChange for internal sync (no session update)
  const handleFolderChange = (folderPath: string) => {
    setCurrentFolder(folderPath);
  };

  const handleTabClick = (filePath: string) => {
    setActiveFile(filePath);
    updateSession(openFiles, filePath);
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
    setOpenFiles((files) => {
      const updated = files.filter((f) => f.filePath !== filePath);
      // Determine new active file
      let newActive = activeFile;
      if (activeFile === filePath) {
        if (updated.length > 0) {
          newActive = updated[updated.length - 1].filePath;
        } else {
          newActive = '';
        }
        setActiveFile(newActive);
      }
      updateSession(updated, newActive);
      return updated;
    });
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
    // Removed setSelectedFileInExplorer
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
    console.log('handleContentChange called for:', filePath);
    setOpenFiles((files) => {
      const updated = files.map(f => f.filePath === filePath ? { ...f, dirty: true } : f);
      console.log('Updated openFiles:', updated);
      return updated;
    });
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

  // Handle file rename (update openFiles and activeFile)
  const handleFileRename = (oldPath: string, newPath: string) => {
    setOpenFiles((files) => {
      // Map oldPath to newPath
      const renamed = files.map(f => f.filePath === oldPath ? { ...f, filePath: newPath } : f);
      // Remove duplicates by filePath, keeping the last occurrence (the renamed one)
      const unique: OpenFile[] = [];
      const seen = new Set<string>();
      for (let i = renamed.length - 1; i >= 0; i--) {
        if (!seen.has(renamed[i].filePath)) {
          unique.unshift(renamed[i]);
          seen.add(renamed[i].filePath);
        }
      }
      return unique;
    });
    setActiveFile((current) => current === oldPath ? newPath : current);
    // updateSession will be called on next file select/tab click
  };

  const handleNewFile = async () => {
    // Get list of files in current folder
    let files: string[] = [];
    try {
      const docs = await documentsApi.listDocuments(currentFolder);
      files = docs.filter(d => !d.isFolder).map(d => d.filePath);
    } catch {
      // ignore
    }
    // Find next available 'New File N.txt'
    let n = 1;
    let newFileName = `New File 1.txt`;
    while (files.includes(newFileName)) {
      n++;
      newFileName = `New File ${n}.txt`;
    }
    const filePath = currentFolder ? `${currentFolder}/${newFileName}` : newFileName;
    try {
      await documentsApi.createDocument({ filePath, content: '', isFolder: false });
      handleFileSelect(filePath);
      setRefreshSignal((s) => s + 1); // trigger FileExplorer refresh
    } catch (e) {
      alert('Failed to create new file.');
    }
  };

  const handleDeleteFile = async () => {
    if (!activeFile) return;
    if (!window.confirm(`Are you sure you want to delete ${activeFile}?`)) return;
    try {
      await documentsApi.deleteDocument(activeFile);
      setOpenFiles((files) => files.filter(f => f.filePath !== activeFile));
      setActiveFile('');
      setRefreshSignal((s) => s + 1);
    } catch (e) {
      alert('Failed to delete file.');
    }
  };

  // Remove selectedFileInExplorer logic for menu

  // Update selectedFileInExplorer when a file is selected in File Explorer
  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyF') {
        e.preventDefault();
        setShowSearchPanel(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch session on startup
  useEffect(() => {
    fetch('/session')
      .then(async res => {
        if (!res.ok) {
          try {
            const data = await res.json();
            if (data && data.code === 'working_folder_not_found') {
              setCurrentFolder(''); // open root
              return null;
            }
          } catch {}
          throw new Error('Failed to fetch session');
        }
        return res.json();
      })
      .then((session) => {
        if (!session) return;
        if (session && Array.isArray(session.openedFiles)) {
          setOpenFiles(session.openedFiles.map((filePath: string) => ({ filePath, dirty: false })));
          if (session.lastActiveFile && session.openedFiles.includes(session.lastActiveFile)) {
            setActiveFile(session.lastActiveFile);
          } else if (session.openedFiles.length > 0) {
            setActiveFile(session.openedFiles[0]);
          }
        }
        if (session && typeof session.workingFolder === 'string') {
          setCurrentFolder(session.workingFolder);
        }
      })
      .catch(err => console.error('Session fetch error:', err));
  }, []);

  // Save file handler
  const handleSaveFile = () => {
    if (!activeFile) return;
    if (editorRefs.current[activeFile] && editorRefs.current[activeFile].current) {
      editorRefs.current[activeFile].current!.save();
    }
  };

  return (
    <div className="App" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <MenuBar
        onNewFile={handleNewFile}
        onSaveFile={handleSaveFile}
        onDeleteFile={handleDeleteFile}
        onSearch={() => setShowSearchPanel(true)}
        saveFileDisabled={!activeFile}
        deleteFileDisabled={!activeFile}
      />
      <main style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <FileExplorer
          onFileSelect={handleFileSelect}
          selectedFile={activeFile}
          onFolderChange={handleFolderChange}
          onUserFolderChange={handleUserFolderChange}
          onFileRename={handleFileRename}
          currentFolder={currentFolder}
          refreshSignal={refreshSignal}
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
                <span style={{ marginRight: 8, fontSize: '13px' }}>
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
            {openFiles.length > 0 ? (
              <div style={{ position: 'relative', height: '100%' }}>
                {openFiles.map((file) => {
                  if (!editorRefs.current[file.filePath]) {
                    editorRefs.current[file.filePath] = React.createRef<TextEditorHandle>();
                  }
                  return (
                  <div
                    key={file.filePath}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: activeFile === file.filePath ? 'block' : 'none',
                    }}
                  >
                    <TextEditor
                        ref={editorRefs.current[file.filePath]}
                      filePath={file.filePath}
                      onSave={handleSave}
                      onLoad={handleLoad}
                      onContentChange={handleContentChange}
                    />
                  </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}>
                <span style={{ color: '#888' }}>No file open</span>
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
      
      {/* Search Panel - Full Width Bottom */}
      {showSearchPanel && (
        <div style={{ 
          borderTop: '1px solid #ccc',
          background: '#fff',
          maxHeight: '300px',
          overflow: 'auto',
          position: 'relative'
        }}>
          <button
            onClick={() => setShowSearchPanel(false)}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'transparent',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#666',
              zIndex: 10,
              padding: '4px 8px',
              borderRadius: '4px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f0f0f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            title="Close search panel"
          >
            ×
          </button>
          <SearchPanel
            currentFolder={currentFolder}
            onOpenFile={handleFileSelect}
          />
        </div>
      )}
    </div>
  );
}

export default App;
