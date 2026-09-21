export type RevisionFields = {
  title: string;
  content: string;
  subtitle?: string | null;
};

export function revisionContentChanged(before: RevisionFields, after: RevisionFields) {
  return (
    before.title !== after.title ||
    before.content !== after.content ||
    (before.subtitle ?? null) !== (after.subtitle ?? null)
  );
}

export function revisionMatchesSnapshot(a: RevisionFields, b: RevisionFields) {
  return (
    a.title === b.title &&
    a.content === b.content &&
    (a.subtitle ?? null) === (b.subtitle ?? null)
  );
}
