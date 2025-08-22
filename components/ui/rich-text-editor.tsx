'use client';

import { useRef, useEffect } from 'react';
import { Editor } from 'primereact/editor';
import { classNames } from 'primereact/utils';
import 'primereact/resources/themes/lara-light-indigo/theme.css'; // Theme
import 'primereact/resources/primereact.min.css'; // Core CSS
import 'primeicons/primeicons.css'; // Icons

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter your content here...',
  className = '',
  readOnly = false,
}: RichTextEditorProps) {
  const editorRef = useRef<Editor>(null);

  const header = (
    <span className="ql-formats">
      <select className="ql-header">
        <option value="1">Heading</option>
        <option value="2">Subheading</option>
        <option value="0">Normal</option>
      </select>
      <select className="ql-font">
        <option value="sans-serif">Sans Serif</option>
        <option value="serif">Serif</option>
        <option value="monospace">Monospace</option>
      </select>
      <select className="ql-size" defaultValue="normal">
        <option value="small">Small</option>
        <option value="normal">Normal</option>
        <option value="large">Large</option>
        <option value="huge">Huge</option>
      </select>
      <button className="ql-bold" aria-label="Bold"></button>
      <button className="ql-italic" aria-label="Italic"></button>
      <button className="ql-underline" aria-label="Underline"></button>
      <button className="ql-strike" aria-label="Strikethrough"></button>
      <button className="ql-list" value="ordered" aria-label="Ordered List"></button>
      <button className="ql-list" value="bullet" aria-label="Bullet List"></button>
      <button className="ql-link" aria-label="Insert Link"></button>
      <button className="ql-image" aria-label="Insert Image"></button>
      <button className="ql-clean" aria-label="Clear Formatting"></button>
    </span>
  );

  return (
    <div className={classNames('rich-text-editor', className)}>
      <Editor
        ref={editorRef}
        value={value}
        onTextChange={(e) => onChange(e.htmlValue || '')}
        style={{ height: '200px' }}
        headerTemplate={header}
        placeholder={placeholder}
        readOnly={readOnly}
        className="border rounded-md"
      />
      <style jsx global>{`
        .rich-text-editor .p-editor-container .p-editor-toolbar {
          background: #f8fafc;
          border-top-left-radius: 0.375rem;
          border-top-right-radius: 0.375rem;
          border: 1px solid #e2e8f0;
          border-bottom: none;
        }
        .rich-text-editor .p-editor-container .p-editor-content {
          border-bottom-left-radius: 0.375rem;
          border-bottom-right-radius: 0.375rem;
          border: 1px solid #e2e8f0;
          border-top: none;
          min-height: 100px;
        }
        .rich-text-editor .p-editor-container .p-editor-content:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 1px #6366f1;
        }
        .rich-text-editor .ql-editor {
          min-height: 100px;
        }
      `}</style>
    </div>
  );
}
