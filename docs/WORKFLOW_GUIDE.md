# ApexIQ V2 Workflow Guide

This guide explains how we will structure the project to support both the **Web App** and the new **Desktop App** in the same repository, while keeping your Fellowship Submission safe and unchanged.

## 1. The New "Monorepo" Structure

We will move from a single-app structure to a multi-app structure (Monorepo). This allows both apps to share code (database types, styles, logic) without duplicating it.

### Current Structure (V1)
```
ApexIQ/
├── src/            # Web App Code
├── public/         # Static assets
├── package.json
└── ...
```

### New Structure (V2)
```
ApexIQ/
├── apps/
│   ├── web/        # (Moved) The existing Next.js app
│   │   ├── src/
│   │   └── package.json
│   └── desktop/    # (New) The Electron/Tauri app
│       ├── src/
│       └── package.json
├── packages/       # (Optional) Shared code
│   └── ui/         # Shared styles/components
├── package.json    # Root config (manages both apps)
└── ...
```

---

## 2. Git Strategy: Protecting Your Submission

We will use **Branches** and **Tags** to keep your Fellowship application safe.

- **`main` Branch**: This remains your "Fellowship Submission" version. We will NOT touch this for a while.
- **`v1.0-submission` Tag**: A permanent "snapshot" of exactly what you submitted. Even if `main` changes later, this tag will always point to the submission code.
- **`v2-expansion` Branch**: This is where ALL new work happens (Desktop app, real-time logic, etc.).

### Visualizing the History
```
(v1.0-submission Tag)
      ↓
o --- o ---------------------------------> [main] (STAYS FROZEN FOR NOW)
       \
        \
         o --- o --- o ------------------> [v2-expansion] (ACTIVE WORK)
```

---

## 3. Interaction with the Public Repository

Your public GitHub repository is just a mirror of your local code.

- **To show your submission:** You keep the `main` branch as the default on GitHub. Anyone visiting sees the V1 code.
- **To work privately:** You push the `v2-expansion` branch to GitHub but don't merge it into `main` yet. You can keep working on it without changing the "front page" of your repo.
- **To release V2:** When V2 is ready, we merge `v2-expansion` into `main`. The public repo then updates to show the new full system.

---

## 4. Command Cheat Sheet

### Phase 1: Setup (Do this ONCE)
Run these commands to lock in your submission and start the new workspace.

```bash
# 1. Tag the current state so you never lose it
git tag v1.0-submission

# 2. Create and switch to the new branch
git checkout -b v2-expansion

# 3. Push the tag and the new branch to your remote (origin)
git push origin v1.0-submission
git push origin v2-expansion
```

### Phase 2: Daily Work
You will almost always be on the `v2-expansion` branch.

```bash
# Check which branch you are on
git branch

# Switch to the V2 work (if not already there)
git checkout v2-expansion

# Save your work
git add .
git commit -m "Working on desktop app..."
git push origin v2-expansion
```

### Phase 3: "I need to show someone my submission"
If you need to go back to *exactly* what you submitted (e.g., to fix a critical bug in the V1 site):

```bash
# 1. Switch back to main
git checkout main

# 2. Make your hotfix
# ... edit files ...
git commit -m "Fix typo in readme"

# 3. Push to public repo
git push origin main

# 4. Go back to V2 work
git checkout v2-expansion
# (Optional) Bring the fix into V2
git merge main
```

---

## 5. Summary of Next Steps

1.  **Execute Phase 1 commands** (Tag & Branch).
2.  **Refactor Folders**: Move current files into `apps/web`.
3.  **Initialize Desktop**: Create `apps/desktop`.
4.  **Resume Coding**: Start building the Electron app in `apps/desktop`.
