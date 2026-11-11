/**
 * VisiOS — JupyterLite & Pyodide Scientific Notebook View
 *
 * Interactive scientific notebook cell executor powered by in-browser Pyodide.
 */

import React, { useState } from 'react';
import { Terminal, Play, RotateCcw, BookOpen, Check, Copy } from 'lucide-react';
import { PyodideNotebookAdapter } from '../adapters/PyodideNotebookAdapter';

export const PyodideNotebookView: React.FC = () => {
  const [adapter] = useState(() => new PyodideNotebookAdapter());
  const templates = adapter.getTemplates();
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
  const [code, setCode] = useState(templates[0].code);
  const [output, setOutput] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  const handleRun = async () => {
    setIsExecuting(true);
    const t0 = performance.now();
    try {
      const res = await adapter.executePythonCode(code);
      setExecutionTime(Math.round(performance.now() - t0));
      setOutput(res.stdout || (res.stderr ? `Error: ${res.stderr}` : 'Done.'));
    } catch (err: any) {
      setOutput(`Runtime Error: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSelectTemplate = (idx: number) => {
    setSelectedTemplateIndex(idx);
    setCode(templates[idx].code);
    setOutput('');
  };

  return (
    <div className="flex flex-col space-y-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-yellow-500/20 text-yellow-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-xs text-white">JupyterLite & Pyodide Scientific Lab</h4>
            <div className="text-[10px] text-slate-400">
              Interactive In-Browser Python Sandbox · NumPy & SymPy Runtimes
            </div>
          </div>
        </div>

        {/* Template Quick Select */}
        <div className="flex items-center gap-1 text-xs">
          {templates.map((tpl, i) => (
            <button
              key={tpl.title}
              onClick={() => handleSelectTemplate(i)}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                selectedTemplateIndex === i
                  ? 'bg-yellow-500 text-slate-950 font-bold'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tpl.title.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Code Editor Area */}
      <div className="flex flex-col rounded-xl border border-slate-800 overflow-hidden bg-slate-900 font-mono text-xs">
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/70 border-b border-slate-800 text-[11px] text-slate-400">
          <span>In [1]: Python 3.10 Code Cell</span>
          <button
            onClick={handleRun}
            disabled={isExecuting}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold transition-colors disabled:opacity-50"
          >
            <Play className="w-3 h-3 fill-current" />
            {isExecuting ? 'Running...' : 'Run Cell'}
          </button>
        </div>

        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={9}
          spellCheck={false}
          className="w-full p-3 bg-transparent text-slate-100 resize-none focus:outline-none focus:ring-0 leading-relaxed font-mono"
        />
      </div>

      {/* Output Console */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-2 text-[10px] text-slate-400">
          <span>Out [1]: Console Output</span>
          {executionTime !== null && (
            <span className="text-emerald-400 font-bold">{executionTime} ms</span>
          )}
        </div>
        <pre className="text-slate-200 whitespace-pre-wrap leading-relaxed min-h-[40px]">
          {output || '# Click "Run Cell" to execute code in sandbox...'}
        </pre>
      </div>
    </div>
  );
};
