# Bun / Dev Check Note

- The npm global prefix on this machine is `C:\Users\PC\AppData\Roaming\npm`.
- If `bun` is not on `PATH`, check the npm-global Bun shims first: `C:\Users\PC\AppData\Roaming\npm\bun.cmd` and `C:\Users\PC\AppData\Roaming\npm\bun.ps1`.
- The repo dev script is `bun run --cwd apps/dev dev`; when running it manually from this environment, prefer the npm-global Bun shim path if plain `bun` fails.
- When I looked up how OpenTUI works, I read the `.md` files under `D:\mitui\node_modules\@opentui\core` and `D:\mitui\node_modules\@opentui\react`.
- If the TUI harness is run again in this environment, verify the actual runtime first: a Node fallback can fail on `node:ffi`, so do not assume a component bug from harness startup errors.
- If OpenTUI intrinsic tags are used again, keep `jsxImportSource` set to `@opentui/react` so `<box>`, `<text>`, and similar tags type-check correctly.
- Source-only package folders in `packages/*` should stay without their own `package.json` when the goal is to keep the package files grouped at the top-level `packages` structure.

## How to update notes

- Keep notes that can prevent repeated mistakes in future sessions, including machine-specific paths if the same environment may be reused.
- Remove notes only when they are truly obsolete or contradicted by the current repo state.
- When revising a note, prefer clarifying its scope over deleting it.
- Record the exact command, path, or config key when that detail matters for avoiding the issue.
- Only update notes when user ask.
