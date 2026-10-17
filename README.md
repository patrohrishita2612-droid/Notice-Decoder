# Notice-Decoder
AI-powered college notice summarization and smart scheduling assistant.

---

## Notice Decoder — Teammate Setup Guide

### 1. Pull the Latest Code

```bash
git checkout main
git pull origin main
```

### 2. Install Dependencies

Open a terminal in the project root.

**Backend**
```bash
cd backend
npm install
cd ..
```

**Frontend**
```bash
cd frontend
npm install
cd ..
```

### 3. Configure Environment Variables

Copy the backend environment template:

**Windows PowerShell**
```powershell
Copy-Item backend\.env.example backend\.env
```

**macOS / Linux**
```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and configure the required variables:

- `GEMINI_API_KEY` — your Gemini API key (obtain from [Google AI Studio](https://aistudio.google.com/)).
- `SUPABASE_URL` — your Supabase project URL (from Supabase Project Settings -> API).
- `SUPABASE_KEY` — your Supabase anon/service key.
- `PORT` — server port (defaults to `5000`).

> [!SECURITY]
> Never commit `.env` files or share private API keys. Both `.env` and `.env.*` are already included in `.gitignore`.

### 4. Start the Servers

Keep the backend and frontend running in separate terminals:

**Terminal 1 — Backend**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend**
```bash
cd frontend
npm run dev
```

Open the local frontend URL printed by Vite, usually `http://localhost:5173/`.

### 5. Features to Explore

- **Student Demo Login:** `student@campus.edu` / `campus2026`
- **Professor Demo Login:** `professor@campus.edu` / `prof2026`
- **Notice Upload & Decoding:** Upload PDF, JPG, or PNG files, or paste notice text. The interactive particle preloader displays during live processing across 4 synchronized stages (*Preparing Document*, *Extracting Information*, *Identifying Dates & Deadlines*, *Checking Calendar Conflicts*).
- **Particle Animation Preview:** In the *Decode Circular* tab, click **Preview Particle Animation (Dev)** to test particle movement, constellations, and cursor ripple interactions across different stages.
- **Weekly Availability Slot Picker:** In the *Academic Calendar* tab, click **Availability Windows** in the top toolbar to configure recurring consultation windows and free meeting slots.

### 6. Quick Troubleshooting

- **Dependency Installation:** Verify that Node.js (v18+) and npm are installed.
- **Frontend / Backend Connection:** Ensure the backend is running on `http://localhost:5000`. If you change `PORT`, update the fetch endpoints in `frontend/src/`.
- **Database / Supabase Warning:** If Supabase keys are left blank in `backend/.env`, the backend will run in offline/memory fallback mode. Add `SUPABASE_URL` and `SUPABASE_KEY` to enable persistent cloud storage.
- **Demo Accounts:** Demo logins are enabled by default in development mode (`import.meta.env.DEV`). In production builds, set `VITE_ALLOW_DEMO_LOGINS=true`.
