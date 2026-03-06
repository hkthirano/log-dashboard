# GitHub MCP Server Setup

## Token

Use a Classic PAT. Fine-grained PAT does not support GitHub Projects (v2) permissions, so Classic PAT is required for kanban and issue management.

### Required Scopes

| Scope | Purpose |
|-------|---------|
| `repo` | Code, commits, branches, PRs, issues |
| `project` | Kanban board (Projects v2) |

---

## Setup Steps

### ① Open Claude Code settings

Open Claude Code in the VS Code sidebar and type the following in the chat input:

```
/config
```

This opens the Claude Code settings UI.

---

### ② Open Environment Variables

Find the **Environment Variables** section in the settings screen.

---

### ③ Add the GitHub token

Add the following environment variable and save.

| Name | Value |
|------|-------|
| `GITHUB_PERSONAL_ACCESS_TOKEN` | `ghp_xxxxxxxxxxxxxxxxx` |

> Generate a token at [GitHub > Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens).

Restart Claude Code after saving.

---

### ④ Configure mcp.json

Place `.mcp.json` in the project root. No `env` entry is needed since the token is managed by Claude Code.

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"]
    }
  }
}
```

---

### ⑤ Enable the MCP server

Claude Code requires explicit approval to activate each MCP server. On first use, a prompt will appear — approve it.

The approval is saved to `.claude/settings.local.json`:

```json
{
  "enabledMcpjsonServers": ["github"]
}
```

This file is **local only** — do not commit it. Add it to `.gitignore`:

```
.claude/settings.local.json
```

---

## GitHub CLI (gh) Setup

### Install

```bash
sudo apt update && sudo apt install curl

# Add GPG key
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | \
  sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg

# Add repository
echo "deb [arch=$(dpkg --print-architecture) \
  signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] \
  https://cli.github.com/packages stable main" | \
  sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null

# Install
sudo apt update && sudo apt install gh

# Verify
gh --version
```

### Login (first time only)

```bash
gh auth login
```

Select: GitHub.com → HTTPS → Browser login

### Common Commands

| Command | Description |
|---------|-------------|
| `gh issue list` | List issues |
| `gh pr create` | Create a PR |
| `gh repo clone owner/repo` | Clone a repository |
| `gh repo create` | Create a new repository |
