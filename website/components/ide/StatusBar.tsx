'use client';

/**
 * Status Bar Component
 * 
 * Displays file information, cursor position, and IDE status
 */

interface StatusBarProps {
  file: string | null;
  line?: number;
  column?: number;
  language?: string;
  isDirty?: boolean;
  fileCount?: number;
}

export default function StatusBar({
  file,
  line = 1,
  column = 1,
  language,
  isDirty = false,
  fileCount = 0,
}: StatusBarProps) {
  return (
    <div className="h-6 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-4 text-xs text-slate-400">
      <div className="flex items-center gap-4">
        {file && (
          <>
            <span className="font-medium">{file}</span>
            {isDirty && <span className="text-yellow-400">●</span>}
            {language && (
              <span className="px-2 py-0.5 bg-slate-800 rounded">{language}</span>
            )}
          </>
        )}
        {!file && <span>No file open</span>}
      </div>

      <div className="flex items-center gap-4">
        {file && (
          <span>
            Ln {line}, Col {column}
          </span>
        )}
        <span>{fileCount} file{fileCount !== 1 ? 's' : ''}</span>
        <span className="text-green-400">●</span>
        <span>Ready</span>
      </div>
    </div>
  );
}
