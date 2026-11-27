# CampusBook — Campus Resource Booking and Utilization System

> **PBL Project** · Object Oriented Techniques using Java · **SDG 4: Quality Education**

A modern, fully-responsive web application for colleges to manage and book campus resources — classrooms, computer laboratories, auditoriums, and meeting rooms — through a centralized platform that eliminates scheduling conflicts.

---

## 🌐 Live Demo

Deploy to Vercel and Supabase following the instructions below to get your public URL.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 Authentication | Supabase Auth with email/password, password reset, session persistence |
| 🎓 Role System | Student, Faculty, and Admin portals with separate dashboards |
| 📅 Smart Booking | Atomic conflict detection via PostgreSQL RPC — no double bookings |
| 🏫 Resource Management | Computer Labs, Classrooms, Auditoriums, Meeting Rooms |
| 📊 Utilization Reports | Booked hours vs available hours (8AM–6PM) with progress bars |
| 🛡️ Row Level Security | All tables protected with Supabase RLS policies |
| 📱 Responsive Design | Works on desktop, tablet, and mobile |

---

## 🛠 Tech Stack

- **Frontend:** React 18 + Vite + JavaScript + Tailwind CSS
- **Backend & DB:** Supabase (PostgreSQL, Auth, RLS, RPC Functions)
- **Hosting:** Vercel (frontend) + Supabase (backend)

---

## 🚀 Deployment Guide

### STEP 1 — Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and click **Start your project**
2. Sign in with GitHub
3. Click **New project** → choose your organization
4. Enter:
   - **Project name:** `campus-resource-booking`
   - **Database Password:** generate a strong password and save it
   - **Region:** choose the nearest region
5. Click **Create new project** and wait ~2 minutes for setup

### STEP 2 — Run the SQL Migrations

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **New query**
3. Copy the entire contents of `supabase/migrations/20260101000001_initial_schema.sql`
4. Paste it into the editor and click **Run** (▶)
5. You should see: `Success. No rows returned`

### STEP 3 — Seed Sample Resources

1. In the SQL Editor, click **New query**
2. Copy the entire contents of `supabase/seed.sql`
3. Paste and click **Run**
4. 5 sample campus resources will be inserted

### STEP 4 — Configure Supabase Authentication

1. In Supabase, go to **Authentication → Providers**
2. Ensure **Email** provider is enabled
3. Go to **Authentication → URL Configuration**
4. Add your site URL (or `http://localhost:5173` for local testing)
5. Add redirect URLs:
   - `http://localhost:5173/**`
   - `https://your-vercel-domain.vercel.app/**`

### STEP 5 — Get Your API Keys

1. Go to **Project Settings → API** in Supabase
2. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
3. ⚠️ **Never copy the service role key into frontend code**

### STEP 6 — Configure Environment Variables Locally

```bash
# In the project root, copy the example file:
cp .env.example .env

# Edit .env and fill in your actual Supabase values:
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### STEP 7 — Run Locally

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Open: http://localhost:5173
```

### STEP 8 — Create the Admin Account

1. Register a new account at `http://localhost:5173/register`
2. Use the email that will be your admin account
3. In Supabase **SQL Editor**, run:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@yourcollege.edu';
```

4. Sign out and sign back in — you'll now see the Admin Dashboard

### STEP 9 — Push to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "feat: initial CampusBook implementation"

# Create a new repo on github.com, then:
git remote add origin https://github.com/yourusername/campus-resource-booking.git
git branch -M main
git push -u origin main
```

> ⚠️ Confirm `.env` is in `.gitignore` before pushing — never commit your API keys.

### STEP 10 — Deploy to Vercel

1. Go to [https://vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New → Project**
3. Import your `campus-resource-booking` repository
4. Configure the project:
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add **Environment Variables**:
   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | `https://your-project-id.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | `your-supabase-anon-key` |
6. Click **Deploy**
7. Wait ~1–2 minutes → Your public URL will appear: `https://campus-resource-booking.vercel.app`

### STEP 11 — Update Supabase Auth URLs

After deployment, go back to **Supabase → Authentication → URL Configuration** and add:
- **Site URL:** `https://your-vercel-domain.vercel.app`
- **Redirect URLs:** `https://your-vercel-domain.vercel.app/**`

### STEP 12 — Test the Live Website

Open your Vercel URL and test:
- [ ] Homepage loads and resources display
- [ ] Register as Student and Faculty
- [ ] Login and dashboard shows correct role
- [ ] Browse Resources page loads from Supabase
- [ ] Book a resource for a future date
- [ ] Confirm booking appears in My Bookings
- [ ] Try booking overlapping slot → should be rejected
- [ ] Book adjacent slot → should succeed
- [ ] Cancel a booking → slot becomes available
- [ ] Admin dashboard shows all bookings and users
- [ ] Utilization report generates correctly

---

## 📁 Project Structure

```
CampusResourceBooking/
├── public/                    # Static assets
├── src/
│   ├── components/            # Reusable UI components
│   ├── context/               # AuthContext, ToastContext
│   ├── hooks/                 # useResources custom hook
│   ├── layouts/               # PublicLayout, DashboardLayout (sidebar)
│   ├── pages/                 # All page components
│   │   ├── admin/             # Admin-only pages
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── ResourcesPage.jsx
│   │   ├── BookResourcePage.jsx
│   │   ├── MyBookingsPage.jsx
│   │   └── ProfilePage.jsx
│   ├── services/              # Supabase API calls
│   ├── styles/                # Tailwind CSS
│   ├── test/                  # Vitest unit tests
│   ├── utils/                 # bookingUtils.js
│   ├── App.jsx                # Router configuration
│   └── main.jsx               # React entry point
├── supabase/
│   ├── migrations/            # SQL schema (tables, RLS, triggers, RPC)
│   └── seed.sql               # Sample campus resources
├── .env.example               # Environment variable template
├── .gitignore
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
├── vercel.json                # SPA routing fallback
└── README.md
```

---

## 🗄️ Database Schema

```sql
profiles  (id, full_name, email, role, created_at)
resources (id, resource_name, resource_type, room_number, capacity, description, is_active, created_at)
bookings  (id, user_id, resource_id, booking_date, start_time, end_time, purpose, status, created_at)
```

**Conflict detection rule:** `newStart < existingEnd AND newEnd > existingStart`
Adjacent bookings are allowed. Cancelled bookings do not block availability.

---

## 🧪 Running Tests

```bash
npm test
```

Tests cover: overlap detection, conflict detection with cancelled bookings, booking form validation, utilization calculation, and formatting utilities.

---

## 🔒 Security

- Row Level Security enabled on all tables
- Users can only view/cancel their own bookings
- Admin role cannot be self-assigned via registration
- Role escalation trigger blocks non-admin updates to `role` field
- No service role key exposed in frontend code
- All booking operations use atomic PostgreSQL RPC functions with row-level locking

---

## 📋 Sample Resources (Pre-seeded)

| Room | Type | Name | Capacity |
|---|---|---|---|
| LAB101 | Computer Lab | Programming & Systems Lab | 40 |
| LAB102 | Computer Lab | Data Science & Networking Lab | 35 |
| CR201 | Classroom | Smart Lecture Classroom | 60 |
| AUD301 | Auditorium | Main Campus Auditorium | 200 |
| MR101 | Meeting Room | Faculty & Project Meeting Room | 15 |

---

*Built with ❤️ for SDG 4: Quality Education*
