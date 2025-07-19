import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { githubLight } from '@uiw/codemirror-theme-github';
import { keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';

interface TextEditorProps {
  filePath?: string;
  onSave?: (content: string) => void;
  onLoad?: (content: string) => void;
  onContentChange?: (filePath: string) => void;
}

export interface TextEditorHandle {
  save: () => void;
}

const TextEditor = forwardRef<TextEditorHandle, TextEditorProps>(
  ({ filePath, onSave, onLoad, onContentChange }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [editorView, setEditorView] = useState<EditorView | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const filePathRef = useRef<string | undefined>(filePath);
    const isInitializedRef = useRef(false);
    const isInitialLoadRef = useRef(true);

    // Update the ref when filePath changes
    useEffect(() => {
      filePathRef.current = filePath;
    }, [filePath]);

    // Update the ref when isInitialized changes
    useEffect(() => {
      isInitializedRef.current = isInitialized;
    }, [isInitialized]);

    // Create CodeMirror instance when component mounts
    useEffect(() => {
      if (!editorRef.current) return;

      const state = EditorState.create({
        doc: '',
        extensions: [
          basicSetup,
          javascript(),
          githubLight,
          keymap.of(defaultKeymap),
          keymap.of([
            {
              key: 'Ctrl-s',
              run: () => {
                saveDocument();
                return true;
              }
            }
          ]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged && isInitializedRef.current && !isInitialLoadRef.current) {
              console.log('Content changed for file:', filePathRef.current, 'isInitialized:', isInitializedRef.current);
              if (typeof onContentChange === 'function' && filePathRef.current) {
                onContentChange(filePathRef.current);
              }
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
    }, []); // Only run once when component mounts

    // Load document content when filePath is available and editor is ready
    useEffect(() => {
      if (!filePath || !editorView || !isInitialized) return;

      const loadDocument = async () => {
        setIsLoading(true);
        isInitialLoadRef.current = true; // Mark as initial load
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
          // Mark initial load as complete after a short delay
          setTimeout(() => {
            isInitialLoadRef.current = false;
          }, 100);
        }
      };

      loadDocument();
    }, [filePath, editorView, isInitialized]);

    // Mark as initialized after a short delay to avoid triggering content change on initial load
    useEffect(() => {
      const timer = setTimeout(() => {
        setIsInitialized(true);
      }, 100);
      return () => clearTimeout(timer);
    }, []);

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

    useImperativeHandle(ref, () => ({
      save: saveDocument,
    }));

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div ref={editorRef} style={{ flex: 1, overflow: 'hidden' }} />
      </div>
    );
  }
);

export default TextEditor; 