Replace every em-dash (`—`) with a regular hyphen (`-`) across all source and public files. This covers user-visible copy (homepage hero, footer, tool descriptions in `src/lib/tools.ts`, privacy/terms/cookies pages) as well as comments/strings in components and hooks - one sweep to guarantee none remain.

Command:

```bash
find src public -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.css' -o -name '*.md' -o -name '*.txt' -o -name '*.html' \) -exec sed -i 's/—/-/g' {} +
```

Then verify with `rg '—' src public` returning no results.

Scope: ~45 files. Pure text substitution, no logic changes.
