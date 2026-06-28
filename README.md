# Zoom Clone — Full Stack Application

A fully functional, pixel-perfect web clone of the Zoom desktop and meeting room interface. This application allows users to create instant meetings, schedule upcoming meetings, join existing sessions via IDs/links, view past meeting history, and participate in a simulated interactive meeting room with toggles for audio, video, screen sharing, and participant tracking.

## Deployed Links

- **Frontend Deployed URL**: https://zoom-clone-puce-rho.vercel.app/
- **Backend Deployed URL**: https://zoom-clone-ysbq.onrender.com

---

## Tech Stack

- **Frontend**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS (customized with Zoom's official color palette)
- **Icons**: Lucide React
- **Backend**: Python FastAPI
- **Database**: SQLite with SQLAlchemy ORM

---

## Project Structure

```
zoom-clone/
├── backend/            # FastAPI Backend Application
│   ├── database.py     # SQLAlchemy Connection Setup
│   ├── models.py       # SQLAlchemy ORM Models
│   ├── schemas.py      # Pydantic Schemas for Validation
│   ├── crud.py         # DB Queries & Mutators
│   └── main.py         # App Initialization & Route Endpoints
├── frontend/           # Next.js 14 Frontend Application
│   ├── src/
│   │   └── app/
│   │       ├── page.tsx                    # Zoom Dashboard
│   │       ├── join/                       # Join Meeting Form
│   │       ├── schedule/                   # Schedule Meeting Form
│   │       ├── meeting/
│   │       │   ├── new/                    # Instant Meeting Redirector
│   │       │   └── [meeting_id]/           # Interactive Dark Meeting Room
│   │       └── globals.css                 # Global CSS Config
│   ├── tailwind.config.ts                  # Extended Zoom Color Palette
│   └── next.config.mjs                     # Rewrites (Proxying /api/* -> Port 8000)
├── .gitignore          # Repository Ignored Items
└── README.md           # Documentation
```

---

## Database Schema

The SQLite database (`zoom.db`) consists of three tables:

### 1. `users` Table
- `id` (INTEGER PRIMARY KEY)
- `name` (TEXT)
- `email` (TEXT UNIQUE)
- `avatar_url` (TEXT, nullable)
- `created_at` (DATETIME)

### 2. `meetings` Table
- `id` (INTEGER PRIMARY KEY)
- `meeting_id` (TEXT UNIQUE) — 9-digit random string formatted as `XXX-XXX-XXX`
- `title` (TEXT)
- `description` (TEXT, nullable)
- `host_id` (INTEGER, FK → `users.id`)
- `invite_link` (TEXT UNIQUE) — stored relative path (e.g. `/join/123-456-789`)
- `scheduled_at` (DATETIME, nullable) — `null` represents an instant meeting
- `duration_minutes` (INTEGER, default 60)
- `status` (TEXT) — `"scheduled"`, `"active"`, `"ended"`
- `created_at` (DATETIME)

### 3. `participants` Table
- `id` (INTEGER PRIMARY KEY)
- `meeting_id` (INTEGER, FK → `meetings.id`)
- `user_id` (INTEGER, FK → `users.id`, nullable) — `null` represents guest participants
- `display_name` (TEXT)
- `joined_at` (DATETIME)

---

## Setup & Running Locally

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### 1. Run the Backend (FastAPI)
1. Navigate to the root directory `zoom/`.
2. Install Python dependencies:
   ```bash
   pip install fastapi uvicorn sqlalchemy httpx
   ```
3. Run the FastAPI development server:
   *(We invoke it using Python module flags to bypass PATH configuration issues)*
   ```bash
   python -m uvicorn backend.main:app --reload --port 8000
   ```
   *The database schema will automatically initialize and auto-seed with a default user and mock upcoming/ended meetings.*

### 2. Run the Frontend (Next.js)
1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Assumptions & Design Choices

1. **Default Authenticated Host**: No login or sign-up flows were created, as specified in the assignment. The app starts on the Dashboard with the database host record `id=1 (Achal Raj, email=achal@zoom.local)` assumed.
2. **Dynamic Invitation Link**: The invite link is stored in the database as `/join/abc-def-ghi` (or `/join/123-456-789`). The frontend dynamically prefixes the client's current browser location (`window.location.origin`) to make copying fully functional.
3. **Interactive Sync**: The meeting room polls `/api/meetings/{meeting_id}` every 3 seconds, meaning that any guest who joins via the `/join` page in another window will pop up inside the meeting grid in real time.
4. **End-to-End State Transition**: A custom `POST /api/meetings/{meeting_id}/end` endpoint was added to the backend. When a host clicks "End Meeting", the server marks the status as `"ended"`. This instantly updates the database and makes the meeting show up in the "Recent Meetings" list on the dashboard.
5. **Simulated Streams**: Rather than using heavy WebRTC services, the meeting room implements high-fidelity CSS and SVG graphics:
   - Microphone ripple animation representing active speech detection.
   - Live stream badges.
   - A detailed mockup desktop report (including visual charts) displayed during screen-share mode.
