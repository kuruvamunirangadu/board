'use client';

import React, { useState, useEffect } from 'react';
import { Editor } from 'tldraw';
import { WorkspaceMode, Workspace } from '@/types';
import { buildObjectContext } from '@/features/intelligence/context-builder';
import { BoardObjectContext } from '@/types/intelligence';
import { UniversalLearningWorkspace } from './UniversalLearningWorkspace';

interface LearningIntelligencePanelProps {
  editor: Editor | null;
  workspace: Workspace;
  mode: WorkspaceMode;
}

export const LearningIntelligencePanel: React.FC<LearningIntelligencePanelProps> = ({
  editor,
  workspace,
  mode,
}) => {
  const [context, setContext] = useState<BoardObjectContext | null>(null);

  // Sync context from editor selection or board shapes in real time
  useEffect(() => {
    if (!editor) return;

    const syncContext = () => {
      const currentCtx = buildObjectContext(editor, workspace);
      setContext((prev) => {
        if (
          !prev ||
          prev.id !== currentCtx.id ||
          prev.type !== currentCtx.type ||
          prev.title !== currentCtx.title
        ) {
          return currentCtx;
        }
        return prev;
      });
    };

    syncContext();
    const unlistenStore = editor.store.listen(syncContext);
    const interval = setInterval(syncContext, 400);

    return () => {
      unlistenStore();
      clearInterval(interval);
    };
  }, [editor, workspace]);

  const activeInput =
    context?.recognizedFormula?.rawText ||
    context?.recognizedFormula?.normalizedFormula ||
    (context?.type === 'formula' ? context.title : null) ||
    (context?.type === 'text' || context?.type === 'note' ? (context.metadata?.text as string) : null) ||
    (workspace.title && workspace.title !== 'Untitled Workspace' ? workspace.title : '');

  return (
    <div className="flex flex-col h-full text-slate-100">
      <UniversalLearningWorkspace
        editor={editor}
        activeInput={activeInput}
      />
    </div>
  );
};
