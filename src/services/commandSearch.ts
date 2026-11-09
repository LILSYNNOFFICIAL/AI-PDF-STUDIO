export interface SearchableEditorCommand {
  id: string;
  label: string;
  keywords?: string[];
}

/** Return commands matching all query terms, regardless of their order. */
export function filterEditorCommands<T extends SearchableEditorCommand>(commands: T[], query: string): T[] {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return commands;
  return commands.filter(command => {
    const haystack = [command.label, ...(command.keywords || [])].join(' ').toLocaleLowerCase();
    return terms.every(term => haystack.includes(term));
  });
}
