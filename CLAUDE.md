# Commit Message Rules

Follow Conventional Commits format:

```
<type>(<scope>): <description>
```

## Types

| Type | Use case |
|------|----------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Refactoring |
| `perf` | Performance improvement |
| `test` | Add or update tests |
| `chore` | Build, dependencies, config |
| `ci` | CI configuration |

## Rules

- Subject line: under 72 characters, imperative mood, no period at end
- Add body only when the change ends explanation
- Never skip hooks (--no-verify)

# Development Workflow

## Branching

- Work on feature branches, never commit directly to main
- Branch naming: `feat/issue-{number}` or `fix/issue-{number}`
- Example: `git checkout -b feat/issue-13`

## Pull Requests

- Open a PR to main for each issue or logical unit of work
- Reference the issue in the PR body (`Closes #N`)
- Commit freely on the feature branch; the pipeline only runs on PRs to main

## Deployment (CI/CD)

- **PR to main** → preview environment deployed automatically
- **PR closed** → preview environment removed automatically
- **`git tag vX.Y.Z && git push --tags`** → production deploy triggered
- Direct pushes to main do NOT trigger the pipeline

## GitHub Project Board

- Project: log-dashboard (linked to this repo, public)
- Add new issues to the board when creating them
- Use the Status field: Todo → In Progress → Done

## Remote

- Remote URL: https://github.com/hkthirano/log-dashboard.git (HTTPS)
