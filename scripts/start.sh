#!/usr/bin/env bash
#
# Production start script — the SAFE way to boot the app on a deploy.
#
# This is what your hosting platform's "start command" should run. It
# does the two things every deploy needs, in the only order that
# preserves data:
#
#   1. `prisma migrate deploy`  — applies any NEW migrations to the
#      EXISTING database. Never drops a table, never wipes a row. If the
#      schema is already current, it's a no-op.
#
#   2. `prisma db seed`         — CREATE-ONLY bootstrap. Refreshes the
#      role/permission matrix from code, and creates the `admin` user
#      ONLY if the database has none yet. On an existing install it
#      changes no user data (see prisma/seed.ts).
#
# Then it starts Next.js.
#
# ⚠️ CRITICAL — DATA PERSISTENCE:
#   This script is correct ONLY IF your DATABASE_URL points at storage
#   that SURVIVES a redeploy. The #1 cause of "my data resets when I
#   update" is an ephemeral container filesystem: if dev.db lives inside
#   the container, every deploy starts from an empty file and there is
#   nothing any script can do to recover it.
#
#   Make ONE of these true:
#     • SQLite: put dev.db on a PERSISTENT VOLUME (e.g. a mounted disk),
#       and set DATABASE_URL="file:/data/together.db" (a path on that
#       volume — NOT ./prisma/dev.db inside the repo).
#     • Postgres: set DATABASE_URL to a managed Postgres instance. The
#       DB lives outside the container entirely, so redeploys never
#       touch the data. See README → "從 SQLite 平移到 PostgreSQL".
#
#   This script NEVER runs `db:reset` / `migrate reset` — those are
#   development-only and WILL wipe data.

set -euo pipefail

echo "▶ Applying database migrations (non-destructive)…"
npx prisma migrate deploy

echo "▶ Bootstrapping (create-only seed; existing data untouched)…"
# Default to production seed (one admin, no demo content). Override with
# SEED_MODE=demo for a throwaway demo box.
SEED_MODE="${SEED_MODE:-production}" npx prisma db seed

echo "▶ Starting Next.js…"
exec npx next start
