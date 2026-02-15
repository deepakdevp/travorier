# Git Workflow & Commit Guidelines

## Branching Strategy

### Main Branches

- `main` - Production-ready code
- `develop` - Integration branch for features
- `staging` - Pre-production testing

### Feature Branches

```bash
# Create feature branch
git checkout -b feature/user-authentication
git checkout -b feature/trip-posting
git checkout -b feature/payment-integration

# Bug fixes
git checkout -b fix/chat-message-bug
git checkout -b fix/payment-webhook-error

# Hotfixes
git checkout -b hotfix/critical-security-patch
```

## Commit Message Convention

We follow **Conventional Commits** format:

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, tooling
- `perf`: Performance improvements
- `ci`: CI/CD configuration changes

### Examples

```bash
# Feature commits
git commit -m "feat(auth): add Google OAuth integration"
git commit -m "feat(trips): implement trip search with filters"
git commit -m "feat(payments): integrate Stripe payment intents"

# Bug fixes
git commit -m "fix(chat): resolve message ordering issue"
git commit -m "fix(api): handle null values in profile update"

# Documentation
git commit -m "docs: add API endpoint documentation"
git commit -m "docs: update setup instructions for Supabase"

# Refactoring
git commit -m "refactor(database): optimize trip search query"
git commit -m "refactor(auth): extract JWT validation to middleware"

# Chores
git commit -m "chore(deps): update expo to v50"
git commit -m "chore: add pre-commit hooks for linting"
```

## Auto-Commit Strategy

### When to Commit

#### Minor Features (Commit Immediately)

Commit after completing small, self-contained units of work:

```bash
# Examples of minor features
- Add a single API endpoint
- Create a UI component
- Write a database migration
- Add a utility function
- Configure a service
```

**Example workflow:**

```bash
# 1. Complete the feature
# ... write code ...

# 2. Stage changes
git add .

# 3. Commit with descriptive message
git commit -m "feat(api): add GET /trips endpoint with filters"
```

#### Major Features (Commit in Logical Chunks)

Break down major features into logical commits:

```bash
# Payment Integration (Major Feature)
git commit -m "feat(payments): add Stripe SDK configuration"
git commit -m "feat(payments): create payment intent endpoint"
git commit -m "feat(payments): add webhook handler for payment events"
git commit -m "feat(payments): implement credit purchase flow"
git commit -m "feat(payments): add transaction history UI"
git commit -m "test(payments): add unit tests for payment service"
```

### Commit Frequency Guidelines

| Task Type | Commit Frequency | Example |
|-----------|------------------|---------|
| **Setup/Config** | Per service | "chore: configure Supabase connection" |
| **Database** | Per migration | "feat(db): add profiles table migration" |
| **API Endpoint** | Per endpoint | "feat(api): add POST /auth/signup endpoint" |
| **UI Component** | Per component | "feat(ui): create TripCard component" |
| **Bug Fix** | Per fix | "fix(chat): resolve duplicate message issue" |
| **Tests** | Per test suite | "test(auth): add unit tests for OTP verification" |
| **Refactor** | Per logical group | "refactor(api): extract validation middleware" |

### Pre-Commit Checklist

Before each commit, ensure:

- [ ] Code runs without errors
- [ ] No console.log or debug prints (unless intentional)
- [ ] No commented-out code blocks
- [ ] No sensitive data (API keys, passwords)
- [ ] Imports are clean (no unused imports)
- [ ] Code follows project style guide

### Git Hooks (Automated)

We use **Husky** for automated checks:

#### Pre-commit Hook

```bash
# .husky/pre-commit
#!/bin/sh

# Lint TypeScript/JavaScript
npm run lint --workspace=mobile

# Format Python
cd backend && black . --check && cd ..

# Type check
npm run typecheck --workspace=mobile

# Check for secrets
git diff --cached --name-only | xargs grep -i "api_key\|secret\|password" && echo "⚠️  WARNING: Possible secret detected!" && exit 1 || exit 0
```

#### Commit-msg Hook

```bash
# .husky/commit-msg
#!/bin/sh

# Validate commit message format
npx commitlint --edit $1
```

## Workflow Examples

### Daily Development Flow

```bash
# 1. Start your day - pull latest changes
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/chat-system

# 3. Work and commit frequently
# ... write code ...
git add app/services/chat.py
git commit -m "feat(chat): add message sending service"

# ... write more code ...
git add app/api/v1/messages.py
git commit -m "feat(api): add POST /messages endpoint"

# ... write tests ...
git add tests/test_chat.py
git commit -m "test(chat): add message service tests"

# 4. Push feature branch
git push -u origin feature/chat-system

# 5. Create pull request on GitHub
# ... review and merge ...

# 6. Delete feature branch
git branch -d feature/chat-system
git push origin --delete feature/chat-system
```

### Hotfix Flow

```bash
# 1. Create hotfix from main
git checkout main
git checkout -b hotfix/payment-webhook-crash

# 2. Fix the issue
# ... fix code ...
git add app/api/v1/payments.py
git commit -m "fix(payments): handle missing signature in webhook"

# 3. Push and deploy immediately
git push -u origin hotfix/payment-webhook-crash

# 4. Merge to main AND develop
git checkout main
git merge hotfix/payment-webhook-crash
git push origin main

git checkout develop
git merge hotfix/payment-webhook-crash
git push origin develop

# 5. Tag the release
git tag -a v1.0.1 -m "Hotfix: Payment webhook crash"
git push origin v1.0.1
```

## Pull Request Guidelines

### PR Title Format

```
<type>(<scope>): <description>

# Examples
feat(auth): implement Google OAuth and mobile OTP
fix(chat): resolve real-time message sync issue
docs: update API documentation for trips endpoint
```

### PR Description Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- List key changes
- Be specific about files/features modified

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] Works on iOS simulator
- [ ] Works on Android emulator

## Screenshots (if applicable)
[Add screenshots for UI changes]

## Related Issues
Closes #123
Related to #456

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed my code
- [ ] Commented complex code sections
- [ ] Updated documentation
- [ ] No new warnings
- [ ] Added tests that prove fix/feature works
- [ ] All tests pass locally
```

## Release Process

### Version Numbering

We use **Semantic Versioning** (SemVer):

```
MAJOR.MINOR.PATCH

1.0.0 - Initial release
1.1.0 - New feature (backward compatible)
1.1.1 - Bug fix
2.0.0 - Breaking change
```

### Creating a Release

```bash
# 1. Update version in package.json and setup.py
npm version minor  # or major/patch

# 2. Update CHANGELOG.md
# ... document changes ...

# 3. Commit version bump
git add .
git commit -m "chore: bump version to 1.1.0"

# 4. Create tag
git tag -a v1.1.0 -m "Release v1.1.0: Add real-time chat feature"

# 5. Push to GitHub
git push origin develop
git push origin v1.1.0

# 6. Merge to main
git checkout main
git merge develop
git push origin main

# 7. Create GitHub Release
# Go to GitHub → Releases → Create new release
# Tag: v1.1.0
# Title: Release v1.1.0
# Description: Copy from CHANGELOG.md
```

## Troubleshooting

### Undo Last Commit (Not Pushed)

```bash
# Keep changes, undo commit
git reset --soft HEAD~1

# Discard changes, undo commit
git reset --hard HEAD~1
```

### Fix Commit Message

```bash
# Last commit only
git commit --amend -m "feat(auth): correct commit message"

# Already pushed (avoid if possible)
git push --force-with-lease
```

### Resolve Merge Conflicts

```bash
# 1. Pull latest develop
git checkout develop
git pull origin develop

# 2. Merge into your feature branch
git checkout feature/your-feature
git merge develop

# 3. Resolve conflicts in files
# ... edit conflicted files ...

# 4. Mark as resolved
git add .
git commit -m "merge: resolve conflicts with develop"
```

### Stash Changes Temporarily

```bash
# Save changes without committing
git stash

# List stashes
git stash list

# Apply latest stash
git stash pop

# Apply specific stash
git stash apply stash@{0}
```

## Best Practices

### DO

✅ Commit early and often
✅ Write descriptive commit messages
✅ Review your own changes before committing (`git diff`)
✅ Keep commits atomic (one logical change per commit)
✅ Test before committing
✅ Pull before pushing
✅ Use feature branches
✅ Delete merged branches

### DON'T

❌ Commit directly to `main`
❌ Commit sensitive data (keys, passwords)
❌ Commit large binary files
❌ Write vague commit messages ("fix stuff", "update")
❌ Mix multiple unrelated changes in one commit
❌ Commit broken code
❌ Force push to shared branches
❌ Rewrite public history

## Useful Git Commands

```bash
# View commit history
git log --oneline --graph --all

# View changes in last commit
git show

# View file history
git log -p filename.ts

# Find who changed a line
git blame filename.ts

# Search commit messages
git log --grep="payment"

# View changes between branches
git diff develop..feature/my-feature

# Undo uncommitted changes
git checkout -- filename.ts

# Undo all uncommitted changes
git reset --hard HEAD

# Create branch from specific commit
git checkout -b new-branch abc123

# Cherry-pick a commit
git cherry-pick abc123
```

## GitHub Integration

### Setting Up GitHub

```bash
# Add remote
git remote add origin https://github.com/yourusername/travorier.git

# Verify remote
git remote -v

# Push first time
git push -u origin main

# Set up develop branch
git checkout -b develop
git push -u origin develop
```

### Branch Protection Rules

Recommended settings for `main` branch:

- ✅ Require pull request reviews (1 reviewer)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Require conversation resolution
- ❌ Allow force pushes
- ❌ Allow deletions

### GitHub Actions (CI/CD)

See `.github/workflows/` for automated:

- Linting on every push
- Testing on every PR
- Deployment on merge to `main`

---

**Remember**: Good commit history is documentation for your future self and teammates!
