# Learnify 🎓

> **Learn Smarter, Not Harder.**

---

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| **Next.js** | 15 (App Router) | Full-stack React framework |
| **TypeScript** | 5 | Type safety |
| **Tailwind CSS** | 3.4 | Utility-first styling |
| **Supabase** | 2.x | Auth + Database |
| **Poppins / Montserrat** | — | Typography |

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev

# 3. Open your browser
# http://localhost:3000
```

---

## Environment Variables

Already configured in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://thjndtmpfnsljxbxsnrs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

For production, add these to your hosting platform (Vercel → Settings → Environment Variables).

---

## Google OAuth Setup (Supabase)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials (Web Application)
3. Add redirect URI: `https://thjndtmpfnsljxbxsnrs.supabase.co/auth/v1/callback`
4. Go to Supabase Dashboard → Authentication → Providers → Google
5. Paste your Client ID and Client Secret → Save

---

## Folder Structure

```
learnify/
├── middleware.ts                   # Route protection + session refresh
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── layout.tsx          # Shared auth page layout
│   │   │   ├── login/page.tsx      # /login
│   │   │   └── signup/page.tsx     # /signup
│   │   ├── auth/
│   │   │   └── callback/route.ts   # Google OAuth callback handler
│   │   ├── dashboard/
│   │   │   ├── layout.tsx          # Protected layout (server auth check)
│   │   │   ├── page.tsx            # /dashboard home
│   │   │   └── profile/page.tsx    # /dashboard/profile
│   │   ├── layout.tsx              # Root layout
│   │   └── page.tsx                # Homepage
│   │
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx       # Email + Google login form
│   │   │   └── SignupForm.tsx      # Signup with password strength
│   │   ├── dashboard/
│   │   │   ├── DashboardShell.tsx  # Sidebar + topbar shell
│   │   │   └── ProfileForm.tsx     # Profile edit form
│   │   ├── layout/
│   │   │   ├── Navbar.tsx          # Auth-aware navbar
│   │   │   └── Footer.tsx
│   │   ├── sections/               # Homepage sections (unchanged)
│   │   └── ui/
│   │       ├── LearnifyLogo.tsx
│   │       └── ThemeProvider.tsx
│   │
│   └── lib/
│       ├── auth/actions.ts         # signIn, signUp, signOut, Google, updateProfile
│       └── supabase/
│           ├── client.ts           # Browser client
│           ├── server.ts           # Server component client
│           └── middleware.ts       # Middleware client + route protection
```

---

## Auth Flow

| Route | Protection | Behavior |
|-------|-----------|---------|
| `/` | Public | Shows "Go to Dashboard" if logged in |
| `/login` | Redirect if authed | Goes to `/dashboard` |
| `/signup` | Redirect if authed | Goes to `/dashboard` |
| `/dashboard/*` | **Protected** | Redirects to `/login` if not authed |

---

## Roadmap

- [x] Email/Password Auth
- [x] Google OAuth
- [x] Protected Dashboard
- [x] User Profile
- [x] Dark/Light Mode
- [ ] Interactive Periodic Table
- [ ] Formula Reference Library
- [ ] Adaptive Quiz Engine
