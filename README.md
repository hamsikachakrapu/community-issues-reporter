# Community Report Issues — COMPLETE PROJECT

This ZIP is deliberately organized into **Frontend**, **Backend**, and **Database** folders.

## Project structure

- `frontend/` — HTML, CSS, and JavaScript website
- `backend/` — Node.js + Express server and CRUD API routes
- `database/setup.sql` — SQL to create the Supabase PostgreSQL `reports` table, grants, and Row Level Security policies
- `.env.example` — configuration template
- `package.json` — backend dependencies and run commands

## Important database note

Supabase is a hosted PostgreSQL database. A ZIP cannot contain your actual live Supabase account/database or its credentials. This ZIP contains the database SQL setup that creates the required table and access policies in your own Supabase project.

## Setup

### 1. Create the Supabase database
1. Open https://supabase.com/dashboard and create a project.
2. In your project, open **SQL Editor** → **New query**.
3. Open `database/setup.sql`, copy all its contents, paste into SQL Editor, and click **Run**.
4. Open **Project Settings / Connect** and copy your **Project URL** and **publishable key**.

### 2. Configure the project
1. In VS Code, open the extracted `Community_Report_Issues_COMPLETE` folder.
2. Copy `.env.example` and rename the copy to `.env`.
3. Fill `.env` with your actual Supabase values:
   ```
   PORT=3000
   SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
   ```
   Do not use a service-role/secret key. Do not upload `.env` to GitHub.

### 3. Install and run
Open the VS Code terminal in the main project folder (the folder containing `package.json`) and run:
```bash
npm install
npm start
```
Then open http://localhost:3000

### 4. Features included
- Responsive HTML/CSS/JavaScript frontend
- Supabase email/password sign-up and login
- Submit and list community issues
- Edit and delete reports (CRUD)
- Status field: Pending, In Progress, Resolved
- Optional photo URL
- Express REST API
- Supabase PostgreSQL database schema and row-level security policies
- GitHub-ready `.gitignore`

Photo file upload and a separate admin dashboard are not included in this core version.
