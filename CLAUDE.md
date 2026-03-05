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
- Add body only when the change needs explanation
- Never skip hooks (--no-verify)
