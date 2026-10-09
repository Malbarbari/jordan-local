# Windows + GitHub operating guide
Commands are for humans in VS Code PowerShell. Replace YOUR_USERNAME and teammate handles. Do not paste real keys into Git commands or agent prompts.
One GitHub repository, four local clones, one branch per task. An AI agent changes files in its human's clone; it does not synchronize other computers.

## 1. Leader: check installed tools
~~~powershell
node --version
npm --version
git --version
code --version
~~~
Use Node 24 LTS on all four computers. Reuse existing VS Code/Git/agent installations.

## 2. Leader: create the scaffold once
Run from the parent folder where you want the project:
~~~powershell
npx create-next-app@latest jordan-local --ts --eslint --tailwind --app --src-dir --import-alias "@/*" --use-npm --disable-git --yes
Set-Location jordan-local
npm install @supabase/supabase-js @supabase/ssr openai zod lucide-react
npm install --save-dev vitest tsx
npm pkg set "engines.node=24.x" "scripts.lint=eslint ." "scripts.typecheck=tsc --noEmit" "scripts.test=vitest run"
code .
~~~
Use current stable packages for this first installation; commit the lockfile and do not upgrade during the event.
If PowerShell blocks npm.ps1/npx.ps1, use npm.cmd and npx.cmd instead. Do not weaken the machine's execution policy just for the hackathon.

## 3. Copy the provided documentation kit
After downloading AI-Quest-2026-Team-Kit.zip to Downloads:
~~~powershell
$KitZip = Join-Path $env:USERPROFILE "Downloads\AI-Quest-2026-Team-Kit.zip"
$KitDir = Join-Path $env:TEMP "ai-quest-kit-20261009"
Expand-Archive -LiteralPath $KitZip -DestinationPath $KitDir -Force
Copy-Item -Path (Join-Path $KitDir "ai-quest-team-kit\*") -Destination . -Recurse -Force
Get-Content .gitignore.additions | Add-Content .gitignore
Copy-Item .env.example .env.local
code .env.local
~~~
Fill only the environment variables you actually have. The API key is shared privately only with the people who need it; the UI owner can use fixtures before live integration.
This kit replaces the scaffold README/AGENTS with the agreed project docs. It contains no application implementation.

## 4. Initialize Git and push
Set your real Git identity; the email may be your GitHub no-reply address.
~~~powershell
git init -b main
git config user.name "YOUR_NAME"
git config user.email "YOUR_GITHUB_EMAIL"
git config core.autocrlf false
git check-ignore -v .env.local
git status --short
npm run build
git add .
git diff --cached --stat
git diff --cached --name-only
git commit -m "chore: bootstrap app and team contracts"
~~~
Before the commit, confirm .env.local/credentials are absent from staged paths. The first scaffold has no meaningful tests yet; do not report them as passed.

In GitHub: New repository → jordan-local → choose visibility allowed by the competition → do NOT initialize README/license/gitignore → Create.
Then:
~~~powershell
git remote add origin https://github.com/YOUR_USERNAME/jordan-local.git
git push -u origin main
~~~
Expected result: GitHub main contains scaffold, lockfile, docs and prompts, without secrets.

If GitHub CLI is already installed, this is an alternative to the browser-create plus remote-add steps, not an additional command:
~~~powershell
gh auth login
gh repo create jordan-local --public --source . --remote origin --push
~~~
Use --private instead if required. Do not create a second repository.

## 5. Add the other three humans
GitHub repository → Settings → Collaborators/Manage access → Add people → exact GitHub usernames → they accept invitations.
You do not share the leader's account/password or give agents account credentials.
Optional commands if gh is already installed:
~~~powershell
gh api --method PUT "repos/YOUR_USERNAME/jordan-local/collaborators/AI_MEMBER" -f permission=push
gh api --method PUT "repos/YOUR_USERNAME/jordan-local/collaborators/DATA_MEMBER" -f permission=push
gh api --method PUT "repos/YOUR_USERNAME/jordan-local/collaborators/UI_MEMBER" -f permission=push
~~~
The leader remains the sole agreed merger; collaborators may have broader technical permissions, so branch rules and team discipline matter.
Protect main: require a PR and one approving review, block force-push/deletion, and require the actual CI job after it exists.
Free branch protection is available for public repositories; private-repository availability depends on the GitHub plan. If unavailable, keep the same manual PR rule.

## 6. Each teammate
~~~powershell
git clone https://github.com/YOUR_USERNAME/jordan-local.git
Set-Location jordan-local
npm ci
Copy-Item .env.example .env.local
code .env.local
code .
~~~
Use exactly one of these branch commands:
~~~powershell
git switch -c feat/ai-engine
# P3 instead: git switch -c feat/data-api
# P4 instead: git switch -c feat/visitor-ui
# P1 after bootstrap: git switch -c feat/business-ui
npm run dev
~~~
Open the Codex panel in VS Code, choose the current workspace, paste your own prompt from prompts/, and inspect its plan before it edits. If you already use Cursor/Claude Code successfully, paste the same prompt there; do not learn a new editor today.
Never ask an agent to "finish the whole app".

## 7. Human checks, commit and push
Example for P2; other members stage only their owned paths that actually exist:
~~~powershell
git status --short
git diff --stat
git diff
npm run lint
npm run typecheck
npm test
npm run build
git add src/lib/recommendation src/app/api/recommend tests/ai scripts/eval-ai.ts docs/evaluation.md
git diff --cached --stat
git commit -m "feat: add validated hybrid recommendations"
git push -u origin feat/ai-engine
~~~
Remove nonexistent paths from git add; do not create dummy files to satisfy the example.
P3 stages their actual backend/data/Auth files. P4 stages visitor page/components/assets. P1 stages only shared/business/config files.
A failed check is a blocker or an explicitly documented environmental limitation, not a successful test.

GitHub → Compare & pull request → base main → draft early → Ready for review after tests.
Use this PR body:
~~~text
Problem:
Changes:
Owned files:
Contract/schema changes: none (or link to approved change)
Validation: exact commands and results
Mocked vs live:
Known limitations:
Manual verification:
~~~
Optional gh:
~~~powershell
$PrBodyPath = Join-Path $env:TEMP "jordan-local-pr.md"
@'
Problem: Visitors need grounded, personalized activity ranking.
Changes: Add structured parsing, deterministic constraints, semantic scoring and fallback.
Validation: REPLACE WITH OBSERVED COMMAND RESULTS.
Mocked vs live: REPLACE WITH ACTUAL STATUS.
Known limitations: REPLACE WITH ACTUAL LIMITATIONS.
'@ | Set-Content -Encoding utf8 $PrBodyPath
gh pr create --base main --head feat/ai-engine --title "feat: validated hybrid recommendations" --body-file $PrBodyPath
~~~

## 8. Update a still-open feature branch
Start with a clean working tree. Commit your own completed work before integration; never discard uncommitted teammate work.
~~~powershell
git status --short
git fetch origin
git switch feat/ai-engine
git merge origin/main
npm ci
npm run lint
npm run typecheck
npm test
npm run build
git push
~~~
Use merge for this hackathon, not rebase on shared/pushed branches.
After your PR is merged, start the next task from updated main:
~~~powershell
git switch main
git pull --ff-only origin main
git switch -c feat/ai-evaluation
~~~
Do not keep developing a squash-merged feature branch.

## 9. Leader review and integration
Review Files changed and permissions/contract differences; ask Codex for a read-only diff review if useful.
Require one other human to review the leader's own PR.
Merge one PR at a time using Squash and merge in GitHub, then:
~~~powershell
git switch main
git pull --ff-only origin main
npm ci
npm run lint
npm run typecheck
npm test
npm run build
~~~
Run the integrated visitor flow after each relevant merge. Trigger/verify production from main only.
Order: contracts → auth/read API → AI engine → visitor wiring → deploy → business create API/UI → optional features.
For local review before merge:
~~~powershell
git fetch origin
git switch --detach origin/feat/ai-engine
npm ci
npm run build
git switch main
~~~
Do not edit in detached HEAD. Use a clean tree and the correct branch name.

## 10. Resolve conflicts safely
~~~powershell
git diff --name-only --diff-filter=U
git status
~~~
The owning human resolves each conflicted file in VS Code's Merge Editor, preserving both intended changes.
For shared contracts/config, P1 decides. For SQL, P3 prepares the resolution and P1 reviews.
Do not blindly Accept All Current/Incoming. Do not hand-merge package-lock.json; P1 reconciles approved package.json dependencies and regenerates the lockfile with npm install.
After resolving:
~~~powershell
git add PATH_TO_RESOLVED_FILE
git diff --check
npm run build
git commit
git push
~~~
To cancel a currently active merge and return to the pre-merge state:
~~~powershell
git merge --abort
~~~
Never use git reset --hard, force-push main or delete another person's changes as a conflict strategy.
Rollback a bad merged change through a new branch and git revert of the squash commit, then review the rollback PR.

## 11. Short glossary
| Command/concept | Practical meaning |
| --- | --- |
| clone | Download a repository and its history for the first time |
| fetch | Download remote history without changing your working files |
| pull | Fetch then integrate into the current branch; use --ff-only for main |
| switch | Move to another branch; -c creates a new one |
| add | Stage selected changes for your next commit |
| commit | Save a local history snapshot |
| push | Upload your commits to GitHub |
| Pull Request | Ask humans to review a proposed branch integration |
| merge | Combine histories/changes |
| rebase | Replay commits onto another base, rewriting commit identities |
| worktree | Additional local folder for another branch of the same repo |

Worktrees are unnecessary here: four computers already provide separate working directories.

