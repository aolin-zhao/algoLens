// Level 2 includes variable/line traces; level 1 provides program output only.
export const executionLanguages: Record<string, { extension: string; supportLevel: number }> = {
  python: { extension: 'py', supportLevel: 2 },
  javascript: { extension: 'js', supportLevel: 1 },
  typescript: { extension: 'ts', supportLevel: 1 },
  java: { extension: 'java', supportLevel: 1 },
  c: { extension: 'c', supportLevel: 1 },
  cpp: { extension: 'cpp', supportLevel: 1 },
  go: { extension: 'go', supportLevel: 1 },
  rust: { extension: 'rs', supportLevel: 1 },
};

export function executionLanguage(id: string) {
  return Object.hasOwn(executionLanguages, id) ? executionLanguages[id] : undefined;
}
