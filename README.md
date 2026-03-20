# Workflow App

A modern workflow management application built with React + TypeScript. This app allows users to create, execute, monitor, and manage workflows through an intuitive UI.

---

## 🚀 Features

* Workflow creation and editing
* Execution tracking
* Approval system
* Audit logs
* Kanban-style visualization
* Dashboard overview
* Authentication (login page)

---

## 📁 Project Structure

```
src/
 ├── components/        # Reusable UI components
 ├── hooks/             # Custom React hooks
 ├── lib/               # Utility functions / services
 ├── pages/             # Application pages (routes)
 │    ├── dashboard.tsx
 │    ├── workflows.tsx
 │    ├── workflow-editor.tsx
 │    ├── executions-list.tsx
 │    ├── execution-detail.tsx
 │    ├── approvals.tsx
 │    ├── audit.tsx
 │    ├── kanban.tsx
 │    ├── login.tsx
 │    └── not-found.tsx
 ├── App.tsx            # Root component
 └── main.tsx           # Entry point
```

---

## ⚙️ Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd workflow-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the development server

```bash
npm run dev
```

App will be available at:

```
http://localhost:5173
```

---

## 🔐 Environment Variables (Optional)

Create a `.env` file in the root directory:

```
VITE_API_BASE_URL=http://localhost:5000
```



MIT License
