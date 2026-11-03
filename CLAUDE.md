# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

SyncSides is a meeting recording platform (like Riverside): participants meet over WebRTC peer-to-peer video, each side records locally in the browser, chunks are uploaded to the backend, and ffmpeg merges them into a single side-by-side video.

Turborepo monorepo with npm workspaces:

- `apps/sync-side` — main Next.js 15 frontend (package name `web`), App Router, Tailwind CSS 4, runs on port 3000
- `apps/backend` — Express 5 + Socket.IO + Prisma/PostgreSQL API server, runs on port 4000
- `apps/docs` — Next.js docs site, port 3001
- `packages/` — shared `@repo/ui`, `@repo/eslint-config`, `@repo/typescript-config`

There is no test suite.

## Commands

Root (runs across workspaces via turbo):

```sh
npm run dev          # dev servers for all apps
npm run build
npm run lint         # next lint --max-warnings 0 in the Next apps
npm run check-types  # tsc --noEmit
npm run format       # prettier on **/*.{ts,tsx,md}
```

Backend (`apps/backend`):

```sh
npm run dev              # tsx ./src/server.ts
npm run build            # tsc → dist/
npm run start            # node dist/server.js
npx prisma generate      # required before first run and after schema changes
npm run prisma:migrate   # prisma migrate deploy
```

Frontend (`apps/sync-side`): `npm run dev` (next dev --turbopack). It also has its own Prisma schema — run `npx prisma generate` here too.

### Environment setup

Both `apps/sync-side` and `apps/backend` need their own `.env` (copy from each app's `.env.example`). Backend needs `DATABASE_URL` (PostgreSQL). Frontend needs `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `NEXT_PUBLIC_BACKEND_URL` (http://localhost:4000 locally). These are also declared in `turbo.json`.

## Architecture

### Two Prisma schemas, one database

Both `apps/backend/prisma/schema.prisma` and `apps/sync-side/prisma/schema.prisma` define the same models (`User`, `Meeting`, `Participant`) against the same PostgreSQL database. The frontend queries the DB directly for NextAuth; the backend for everything else. **A model change must be made in both schemas**, and each app needs its own `prisma generate`.

- `Meeting.meetingId` is a unique string (the shareable meeting code); `Meeting.id` (int) is referenced elsewhere as `meetingNoId`.
- `Participant` has composite PK `(userId, meetingNoId)` and tracks `hasJoined`/`joinedAt`/`leftAt`.

### Backend (`apps/backend/src/server.ts`)

Single entry point that hosts both the REST API and the Socket.IO server on the same HTTP server:

- REST routes under `/api/*` (auth, meeting, upload, merge, recordings, merge/side-by-side), each a `routes/*.ts` + `controllers/*Controller.ts` pair.
- Socket.IO handles WebRTC signaling (`offer`/`answer`/`ice-candidate`, relayed by target socket id), meeting membership (`join-meeting` upserts `Participant` and broadcasts `participants-updated`), chat, hand-raise, and mute/video state. A `socketUserMap` maps socket id → `{userId, meetingNoId, userEmail}`.
- Meeting duration is derived from the host: when the host's socket disconnects, `durationMs` is computed from the host's `joinedAt`/`leftAt` and `meeting-ended` is broadcast.
- Recording chunks are uploaded via multer, merged with fluent-ffmpeg/ffmpeg-static (`utils/ffmpegMerge.ts`: chunk concat and side-by-side compose), and served statically from `/uploads` and `/merged`.

Note: recording/merging does not work on the production Render deployment (memory limits); run locally to exercise it.

### Frontend (`apps/sync-side`)

- Auth is NextAuth (JWT sessions) at `app/api/auth/[...nextauth]/route.ts` with Credentials (bcryptjs against the shared DB) and Google providers. `middleware.ts` guards `/dashboard`, `/meeting`, `/merge` (redirect to `/auth/login`) and bounces logged-in users off `/auth/*`.
- `app/(dashboard)/` is the authenticated shell (dashboard, recordings, merge, preview, schedule, settings, account). `app/meeting/[id]/page.tsx` is the meeting room — it owns the WebRTC peer connections, local MediaRecorder capture, chunk upload, and the Socket.IO client.
- All backend calls (REST + Socket.IO) go through `NEXT_PUBLIC_BACKEND_URL`; landing-page sections live in `components/`.
