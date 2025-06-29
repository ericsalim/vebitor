import React, { useEffect, useRef, useState } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';

interface TextEditorProps {
  filePath?: string;
  onSave?: (content: string) => void;
  onLoad?: (content: string) => void;
}

const TextEditor: React.FC<TextEditorProps> = ({ filePath, onSave, onLoad }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editorView, setEditorView] = useState<EditorView | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: '',
      extensions: [
        basicSetup,
        javascript(),
        oneDark,
        keymap.of(defaultKeymap),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            // Handle content changes if needed
          }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    setEditorView(view);

    return () => {
      view.destroy();
    };
  }, []);

  const loadDocument = async () => {
    if (!filePath || !editorView) return;

    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/documents/${encodeURIComponent(filePath)}`);
      if (response.ok) {
        const doc = await response.json();
        const newState = editorView.state.update({
          changes: {
            from: 0,
            to: editorView.state.doc.length,
            insert: doc.content,
          },
        });
        editorView.dispatch(newState);
        onLoad?.(doc.content);
      } else {
        console.error('Failed to load document');
      }
    } catch (error) {
      console.error('Error loading document:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveDocument = async () => {
    if (!filePath || !editorView) return;

    const content = editorView.state.doc.toString();
    try {
      const response = await fetch(`http://localhost:8080/documents/${encodeURIComponent(filePath)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath,
          content,
        }),
      });

      if (response.ok) {
        onSave?.(content);
        console.log('Document saved successfully');
      } else {
        console.error('Failed to save document');
      }
    } catch (error) {
      console.error('Error saving document:', error);
    }
  };

  useEffect(() => {
    if (filePath && editorView) {
      loadDocument();
    }
  }, [filePath, editorView]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
        <button onClick={saveDocument} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Save'}
        </button>
        {filePath && <span style={{ marginLeft: '10px' }}>File: {filePath}</span>}
      </div>
      <div ref={editorRef} style={{ flex: 1, overflow: 'hidden' }} />
    </div>
  );
};

export default TextEditor; 