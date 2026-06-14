# Git for Solo Developers — A Beginner's Guide

This guide is written for someone building a React Native iOS app on Windows who has
never used Git before. It covers only what you will actually use as a solo developer.
Team collaboration features are not covered here — they are not relevant to your workflow.

---

## 1. What Git Does

Git is a save system for your code. Every time you reach a point where things are
working, you take a snapshot. That snapshot is permanent — you can always go back to it.
If you spend three hours experimenting and break everything, one command brings your
project back to the last working state. If you want to see what your code looked like
two weeks ago, you can. Git does not sync to the internet on its own, does not require
an account, and does not need to be connected to anything — it is entirely local on your
machine unless you choose to back up to GitHub.

---

## 2. First-Time Setup

Before you use Git for the first time, tell it your name and email. These get attached
to every snapshot you take. Run these two commands once — you will never need to run them
again on this machine.

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

The `--global` flag means "apply this to every project on this machine." Without it,
you would need to run the command again inside each project folder. Run it once, and
you are done.

---

## 3. The Three Commands Used in Every Session

These three commands are the entire core of solo Git use. You will use them constantly.

---

### `git status`

Shows you what has changed since your last snapshot.

```bash
git status
```

Run this any time you want to see where you stand. It tells you which files have been
modified, which are new, and which are staged (ready to be saved). If you are unsure
what state your project is in, run `git status` first.

---

### `git add -A`

Stages all your changes — marks them as "include these in the next snapshot."

```bash
git add -A
```

The `-A` means "everything in the entire project — new files, modifications, and
deletions." Think of it as putting your changed files into a box before sealing it.
Nothing is saved yet — you are just selecting what to save.

You may also see `git add .` in tutorials. In Git 2.x (which you have), it behaves
identically to `git add -A` as long as you run it from the project root — which you
always will. The difference only matters if you `cd` into a subfolder first: `git add .`
would only stage changes inside that subfolder, while `git add -A` always stages
everything. Use `git add -A` and you never have to think about it.

---

### `git commit -m "message"`

Takes the snapshot. Everything in the box gets permanently saved with a label you write.

```bash
git commit -m "your message here"
```

The message is for you. Write something that will make sense in three weeks when you
are scrolling through your history trying to find where a bug was introduced.

**Good commit messages for a React Native project:**

```bash
git commit -m "Scaffold Expo project — bare working shell"
git commit -m "Add BattleScreen layout and amber gradient placeholder"
git commit -m "Wire up SessionService — sessions save and load correctly"
git commit -m "Fix recommitment timer — was firing 10s early"
git commit -m "Complete BattleVisual animation — progress prop wired to gradient"
git commit -m "Before EAS build — all Phase 1 screens verified in Expo Go"
```

Bad commit messages: `"fix"`, `"update"`, `"stuff"`, `"asdf"`. These are useless
when you are trying to find a specific working state six weeks from now.

**The full sequence — what you type in every session:**

```bash
git status              # see what changed
git add -A              # stage everything
git commit -m "message" # save the snapshot
```

---

## 4. When to Commit

The most common mistake beginners make is committing too rarely. As a solo developer,
commit frequently. Storage is free. Regret is not.

**Commit after scaffolding completes.**
Before you write a single line of your own code, after `npx create-expo-app` runs and
the project boots in Expo Go — take a snapshot. This is your clean baseline. If
something goes wrong early, you can always return here.

```bash
git commit -m "Scaffold Expo project — baseline, boots in Expo Go"
```

**Commit after each feature works in Expo Go.**
When a screen renders correctly, when a service function returns the right data, when
an animation runs as intended — commit immediately. Do not wait until "it's done." Done
is a myth. Commit when it works.

**Commit before every EAS build.**
Before triggering a cloud build, commit. This gives you a known snapshot that matches
exactly what the build was created from. When the build is reviewed on device and
something is wrong, you know exactly where the code stood.

```bash
git commit -m "Before EAS build — HomeScreen and BattleScreen complete"
```

**Commit before giving Claude Code a large task.**
Before asking an AI assistant to make significant changes to your project, commit.
If the changes go in the wrong direction, you can discard everything and return to
this snapshot instantly.

**Commit after Claude Code completes a session.**
When a working session ends and the result is good, save it. This marks the boundary
between "what I had" and "what was added," which is useful for reviewing changes later.

---

## 5. How to Undo

This is the section most beginners are afraid of. The fear is reasonable — undoing
changes feels dangerous. But Git makes it safe, as long as you understand what each
command does.

---

### See your recent snapshots

```bash
git log --oneline
```

This shows a compact list of your commits, most recent first. Each line has two parts:
a short code (the commit hash) and the message you wrote.

```
a3f9c12 Fix recommitment timer — was firing 10s early
8b2e441 Wire up SessionService — sessions save correctly
f1d0c93 Add BattleScreen layout and gradient placeholder
3c88a02 Scaffold Expo project — baseline, boots in Expo Go
```

The short codes (like `a3f9c12`) are how you refer to a specific snapshot in the
commands below.

---

### Undo all changes back to the last commit

You have been experimenting and broken something. Everything since your last commit
is wrong and you want to throw it away.

```bash
git restore .
```

This discards all unsaved changes and returns every file to the state it was in at
your last commit. Any work you have not committed is permanently gone. Use this when
the work since your last commit is not worth keeping.

---

### Look at an earlier commit (read-only)

You want to see what your code looked like at a specific earlier point, without
changing anything permanently.

```bash
git checkout f1d0c93
```

Replace `f1d0c93` with the hash from `git log --oneline`. Your files will change to
match that snapshot. You are now in "detached HEAD" mode — a read-only view of the
past. You can look at the code, copy something you want to reuse, and then return to
your current state:

```bash
git checkout main
```

This is safe. It does not delete anything.

---

### Permanently reset to an earlier commit

**Read this carefully before running this command.**

```bash
git reset --hard f1d0c93
```

This command permanently deletes every commit that came after `f1d0c93`. Not hidden —
deleted. There is no undo. The code those commits contained is gone.

Use this only when you are certain you want to throw away recent work. For example:
you committed a series of changes that made things worse, you have decided to start
that feature over, and you want to return to the last known-good state.

Before running `git reset --hard`, ask yourself: "Am I absolutely certain I will
never want any of the code in the commits I am about to delete?" If there is any
doubt, use `git checkout` to look first.

---

## 6. The `.gitignore` File

Your project contains files that should never be saved in Git. The `node_modules`
folder — which contains thousands of library files downloaded by npm — does not
belong in your snapshots. It is enormous, it can be recreated at any time by running
`npm install`, and saving it would make every commit slow and bloated.

The `.gitignore` file tells Git which files and folders to ignore entirely. Create
this file in the root of your project. Git will never include anything listed in it.

**Why `node_modules` must be in `.gitignore`:**
It can contain hundreds of thousands of files. A single commit with `node_modules`
can be gigabytes in size. Anyone cloning your project (or you, on a new machine)
runs `npm install` and gets it back in seconds.

**Why `.env` must be in `.gitignore`:**
`.env` files contain secrets — API keys, tokens, passwords. If you accidentally
commit a `.env` file and push it to GitHub, those secrets are exposed. Keep them
out of Git entirely.

**Correct `.gitignore` for a React Native / Expo project:**

```
# Dependencies
node_modules/

# Expo
.expo/
dist/
web-build/

# Native builds
ios/
android/

# Environment variables — never commit secrets
.env
.env.local
.env.*.local

# EAS
.eas/

# OS files
.DS_Store
Thumbs.db

# Editor
.vscode/
*.swp
*.swo

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# TypeScript
*.tsbuildinfo
```

Save this file as `.gitignore` (the dot at the start is part of the filename) in the
root of your project — the same folder that contains `package.json`.

---

## 7. Optional: Backing Up to GitHub

Everything so far has been entirely local — your snapshots exist only on your machine.
If your hard drive fails, your history is lost. GitHub is a website that stores a copy
of your Git history in the cloud. It is free for personal projects and takes about
two minutes to set up.

This is optional. Your project works fine without it. But if you want a backup:

1. Create a free account at github.com
2. Create a new repository (private — no need to make it public)
3. Run these two commands from your project folder:

```bash
git remote add origin https://github.com/yourusername/your-repo-name.git
git push -u origin main
```

`git remote add origin` tells your local Git where to send backups.
`git push` sends all your snapshots to GitHub.

After the first push, `git push` alone is enough to back up new commits.

---

## Cheat Sheet — The 5 Commands You Will Use 90% of the Time

```
┌─────────────────────────────────────────────────────────────────────┐
│                     GIT QUICK REFERENCE                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  See what changed                                                   │
│  git status                                                         │
│                                                                     │
│  Stage all changes                                                  │
│  git add -A                                                         │
│                                                                     │
│  Save a snapshot                                                    │
│  git commit -m "describe what works"                                │
│                                                                     │
│  See recent snapshots                                               │
│  git log --oneline                                                  │
│                                                                     │
│  Throw away all changes since last commit                           │
│  git restore .                                                      │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  DANGER ZONE — read before using                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Look at an old commit (safe, read-only)                            │
│  git checkout [hash]                                                │
│  git checkout main          ← return to present                    │
│                                                                     │
│  DELETE everything after a commit (permanent, no undo)             │
│  git reset --hard [hash]                                            │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  EVERY WORKING SESSION                                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  git status                 ← where am I?                          │
│  git add -A                 ← stage everything                     │
│  git commit -m "message"    ← save the snapshot                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**When to commit — the short version:**
- After scaffolding boots in Expo Go
- After each feature works
- Before every EAS build
- Before giving Claude Code a large task
- After Claude Code finishes a session
