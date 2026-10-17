import { useEffect, useId, useState } from 'react';
import { useMonaco } from '@monaco-editor/react';
import { Button } from '@algovision/ui';
import { editorLanguages } from './editor-languages';
import type { Implementation } from './content-browser';

/** Read-only code uses the same tokenizer and active theme as the workspace editor. */
export function SolutionCode({ implementations, selected, onSelect, onLoad, canLoad }: {
  implementations: Implementation[];
  selected: Implementation;
  onSelect: (id: string) => void;
  onLoad: () => void;
  canLoad: boolean;
}) {
  const monaco = useMonaco();
  const id = useId();
  const [highlight, setHighlight] = useState({ code: '', language: '', html: '' });
  useEffect(() => {
    if (!monaco) return;
    let revision = 0;
    const colorize = () => {
      const current = ++revision;
      // Monaco escapes the source before producing token spans; never inject raw solution code.
      void monaco.editor.colorize(selected.code, selected.languageId, { tabSize: 4 }).then(html => {
        if (current === revision) setHighlight({ code: selected.code, language: selected.languageId, html });
      }).catch(() => {
        if (current === revision) setHighlight({ code: '', language: '', html: '' });
      });
    };
    colorize();
    const observer = new MutationObserver(colorize);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'style'] });
    return () => { revision++; observer.disconnect(); };
  }, [monaco, selected.code, selected.languageId]);
  const highlighted = highlight.code === selected.code && highlight.language === selected.languageId && !!highlight.html;
  return <section className="solution-code-card" aria-label="解法代码">
    <div className="solution-code-header">
      <div className="solution-language-tabs" role="tablist" aria-label="题解代码语言">
        {implementations.map((item, index) => {
          const active = item.id === selected.id;
          const multipleModes = implementations.some(other => other.languageId === item.languageId && other.mode !== item.mode);
          return <button type="button" role="tab" key={item.id} id={`${id}-tab-${item.id}`} aria-selected={active}
            aria-controls={`${id}-code`} tabIndex={active ? 0 : -1} onClick={() => onSelect(item.id)}
            onKeyDown={event => {
              let next: number;
              if (event.key === 'ArrowRight') next = (index + 1) % implementations.length;
              else if (event.key === 'ArrowLeft') next = (index - 1 + implementations.length) % implementations.length;
              else if (event.key === 'Home') next = 0;
              else if (event.key === 'End') next = implementations.length - 1;
              else return;
              event.preventDefault();
              onSelect(implementations[next].id);
              document.getElementById(`${id}-tab-${implementations[next].id}`)?.focus();
            }}>
            {editorLanguages.find(language => language.id === item.languageId)?.label ?? item.languageId}
            {multipleModes && <small> · {item.mode === 'core' ? '核心代码' : '完整程序'}</small>}
          </button>;
        })}
      </div>
      <span title={canLoad ? undefined : '当前语言的核心代码尚未接入运行器'}>
        <Button variant="ghost" className="solution-load-button" disabled={!canLoad} onClick={onLoad}>载入编辑器</Button>
      </span>
    </div>
    <div role="tabpanel" id={`${id}-code`} aria-labelledby={`${id}-tab-${selected.id}`} tabIndex={0} className="solution-code-panel">
      <pre className="solution-source">{highlighted
        ? <code dangerouslySetInnerHTML={{ __html: highlight.html }} />
        : <code>{selected.code}</code>}
      </pre>
    </div>
  </section>;
}
