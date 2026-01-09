# Contributing to InsurAI

Thank you for contributing to **InsurAI – Corporate Policy Automation and Intelligence System** 🎉

To keep our codebase clean, stable, and professional, we follow a structured Git workflow. Please read and follow this guide strictly.

---

## 📌 Branch Structure

We use the following branches:

* **main** → Stable, production-ready code
* **dev** → Integration & testing branch
* **Feature branches** → Individual work

---

## ❗ Rules (Mandatory)

❌ Do NOT push directly to `main`
❌ Do NOT push directly to `dev`
✅ Always create your own branch
✅ Always use Pull Requests
✅ Write meaningful commit messages

---

## 🔧 Step-by-Step Contribution Process

### 1️⃣ Clone the Repository (Only Once)

```bash
git clone https://github.com/krishna-nagiri/InsurAi.git
cd InsurAi
```

---

### 2️⃣ Switch to `dev` and Pull Latest Changes

```bash
git checkout dev
git pull origin dev
```

---

### 3️⃣ Create Your Own Branch

Use meaningful names:

#### Frontend

```bash
git checkout -b frontend-login
```

#### Backend

```bash
git checkout -b backend-auth
```

#### Docs / Config

```bash
git checkout -b docs-readme
```

---

### 4️⃣ Make Changes & Commit

```bash
git add .
git commit -m "Your meaningful message"
```

---

### 5️⃣ Push Your Branch

```bash
git push origin your-branch-name
```

---

### 6️⃣ Create a Pull Request (PR)

On GitHub:

* Base branch → `dev`
* Compare → your branch
* Add a clear title and description
* Request review

---

## 🧑‍💻 Team Lead Workflow

The Team Lead will:

✅ Review Pull Requests
✅ Suggest improvements
✅ Approve & merge into `dev`
✅ Ensure stability
✅ Merge `dev` → `main` only after milestones

---

## 🚀 Merging to Main

Code will be merged to `main` only when:

✔ Milestone is completed
✔ All features are tested
✔ No major bugs
✔ Approved by team lead

---

## 🤝 Why This Workflow?

This helps us:

✔ Avoid conflicts
✔ Maintain clean history
✔ Track changes
✔ Prevent bugs
✔ Follow industry standards

---

If you face any issues or confusion, contact the Team.

