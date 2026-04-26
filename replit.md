# CarCare IL

## Overview

A full-stack car management platform for the Israeli market. Hebrew RTL UI, premium clean design targeting Israeli drivers.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/carcare), Hebrew RTL, Heebo font
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Cookie-based session auth with bcryptjs
- **Validation**: Zod (zod/v4), drizzle-zod
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **UI**: shadcn/ui, Tailwind CSS, Lucide icons, Framer Motion

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Features

- **Auth**: Email/password register+login, role-based (user vs garage_owner)
- **Cars**: Add by license plate (auto-lookup), mileage selection, health tracking
- **Maintenance**: Auto-generated tasks (oil, brakes, tires, etc.) by car age/mileage
- **Garages**: Marketplace listing, city filter, specializations, ratings
- **Bookings**: Create/manage appointments, garage owner accept/reject
- **Service Records**: Full history, receipt upload, PDF export
- **Dashboard**: Summary for users + garage owner analytics

## Database Tables

- `users` — email/password, role (user|garage_owner|admin)
- `cars` — license plate, make/model/year, mileage, health score
- `garages` — name, address, city, specializations, rating
- `maintenance_tasks` — urgency (critical|soon|routine), diy flag
- `bookings` — status (pending|confirmed|rejected|completed|cancelled)
- `service_records` — title, cost, mileage, receipt URL

## Demo Credentials

- User: demo@carcare.co.il / password (hash: bcrypt of "password")
- Garage owner: garage@carcare.co.il / password

## Architecture

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
