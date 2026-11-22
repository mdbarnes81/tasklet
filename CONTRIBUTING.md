# Contributing

## Workflow

1. Open an issue with the **Feature request** or **Bug report** template. Acceptance criteria matter:
   they become the tests.
2. Build on a branch, by hand or with the Copilot agents (start with **orchestrator**).
3. Run `npm run check` locally.
4. Open a PR using the template. Copilot code review runs with `.github/instructions/code-review.instructions.md`.

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `test:`, `refactor:`,
`chore:`, `ci:`. Use `fix(security):` for security fixes. The `release-notes` skill relies on this.

## Changing agent behaviour

Files under `.github/agents`, `.github/skills`, `.github/instructions`, `.github/hooks`, plus `AGENTS.md`
and `.github/copilot-instructions.md`, change how AI agents behave in this repo. Treat them like code:

- Follow `.github/instructions/copilot-config.instructions.md`.
- Run `npm run validate:copilot`.
- Expect review from the AI governance owners in `CODEOWNERS`.
- Describe in the PR what behaviour you expect to change and how you tested it (e.g. a sample prompt and the before/after result).

## Ground rules

See the **Boundaries** section of [AGENTS.md](AGENTS.md). They apply to humans too.
