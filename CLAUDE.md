# Development workflow

**Vibe-code style**: Work on one thing at a time with quick iterations. Keep responses
concise and focused. Only use brainstorming when explicitly needed or when starting
significant new features. Default to direct implementation for small tasks.

**Package manager**: Always use `bun`, never `npm` or `yarn`. Each project has a Nix
devshell available (`nix develop`) that provides bun and other dependencies.

**Testing**: Tests are located in `test/` directories (not `__tests__/` or co-located).
Run tests with `bun run test` (in app/, use `bun test`). The mcp-server requires Node.js
via vitest due to Comunica compatibility. Add tests before implementing features when using TDD.

**Commits**: Always reference `.conventional-commits.md` to determine the correct format
and type for commit messages. Follow the specification exactly. Keep commit messages
concise - use a brief subject line (max 72 chars) and only add body text if necessary.
Do NOT include verbose file-by-file breakdowns or bullet lists of changes. Focus on the
"why" and overall impact, not granular "what changed in each file" details.

**TDD workflow**: Use `/tdd [feature]` to implement features using dual-agent TDD:
- Test Agent writes failing tests first
- Implementation Agent makes tests pass with minimal code
- Enforces strict TDD discipline (no code before failing test)
- Maintains quick iteration cycles

# Skills to disable

Do NOT use any custom plugin skills in this project, unless the user tells you to!
