# Agent Instructions

## Documentation: use Context7

Always use Context7 when I need code generation, setup or configuration steps, or library/API documentation. Automatically use the Context7 tools to resolve the library ID and fetch library docs without me having to explicitly ask. Base code suggestions on the current, version-specific docs returned by Context7 rather than on training data.

### When to invoke
- Any question about an external library, framework, SDK, or API
- Generating code that imports or calls a third-party package
- Setup, installation, or configuration steps for a tool
- Debugging errors that may stem from outdated or incorrect API usage

### How to invoke
1. Resolve the library name to a Context7 ID (e.g. `next.js` → `/vercel/next.js`).
2. Fetch the docs for that ID, scoped to the relevant topic and version.
3. Use the returned snippets as the source of truth for signatures, options, and patterns.

### Specifying libraries and versions
- If the exact library is known, pass its Context7 ID directly to skip the matching step:
  `Implement basic auth with Supabase. use library /supabase/supabase for API and docs.`
- For a specific version, mention it in the request:
  `How do I set up Next.js 14 middleware?`

### Notes
- Prefer official, current docs over assumptions; do not invent method names or options.
- If Context7 returns no match for a library, say so rather than guessing.
- Mention a CONTEXT7_API_KEY in the environment is used for higher rate limits when available.
