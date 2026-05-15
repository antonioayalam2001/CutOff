# AGENTS.md

## Project structure
- Monorepo: `backend/` (NestJS 10 + TypeORM + PostgreSQL), `frontend/` (Next.js 14 App Router + TailwindCSS)
- Docker: `docker-compose up -d` starts postgres (5432) + pgadmin (5050, admin@admin.com/admin)
- Root `.env` holds DB and JWT config. Backend loads it via `@nestjs/config`.

## Backend (NestJS)
- **Global prefix**: `api` set in `main.ts`. Controllers use `@Controller('auth')` NOT `@Controller('api/auth')`.
- **Port**: `process.env.PORT || 3001`
- **Path aliases**: `@common/*`, `@modules/*`, `@database/*` → `src/common/`, `src/modules/`, `src/database/`
- **Database**: `synchronize: true` in DatabaseModule — schema auto-syncs from entity files. Entities are auto-loaded via glob pattern.
- **Auth**: JWT via passport. Token in `Authorization: Bearer <token>` header.
- **Guards requiring GroupsModule**: `GroupMemberGuard` and `GroupOwnerGuard` use `@InjectRepository()` for `GroupMember`/`Group`. Any module whose controller uses these guards **must import `GroupsModule`** (which exports `TypeOrmModule` with both entities).
- **Modules**: `auth`, `users`, `groups`, `cards`, `expenses`, `billing`. `CardsModule`, `ExpensesModule`, `BillingModule` all import `GroupsModule`.

### Commands (run from `backend/`)
| Command | Action |
|---|---|
| `npm run start:dev` | Dev server with watch |
| `npm run build` | Compile to `dist/` |
| `npm test` | Jest unit tests (`*.spec.ts`) |
| `npm run lint` | ESLint with `--fix` |
| `npm run format` | Prettier |

## Frontend (Next.js)
- **API client**: `src/lib/api.ts` — Axios instance, baseURL `http://localhost:3001/api`, auto-attaches JWT from localStorage, redirects to `/login` on 401.
- **State**: Zustand (`authStore.ts`) for auth. TanStack Query for server state.
- **UI components**: `src/components/ui/` (Button, Input, Badge, Modal).
- **Auth flow**: Register/Login pages call authStore → POST `/auth/register` or `/auth/login` → JWT + user saved to localStorage.
- **Routes**: `/` → landing, `/login`, `/register`, `/dashboard`, `/groups`, `/groups/[id]` etc.

### Commands (run from `frontend/`)
| Command | Action |
|---|---|
| `npm run dev` | Dev server on :3000 |
| `npm run build` | Production build |
| `npm run lint` | `next lint` |

## Common gotchas
1. **Double `/api` prefix**: `main.ts` sets global prefix `api`. Controller paths must NOT include it.
2. **Group guards need GroupsModule**: Adding a guard like `GroupMemberGuard` to a controller requires the containing module to `imports: [GroupsModule]`.
3. **TypeORM synchronize**: Schema changes are auto-applied on startup. No migrations needed in dev.
4. **Backend runs on :3001**, frontend on :3000. CORS is configured for `localhost:3000`.
5. **New backend modules**: Register in `app.module.ts`, add entity to a `TypeOrmModule.forFeature()` if needed.
6. **`nanoid` v3**: Backend uses `nanoid@3.3.7` (CommonJS). Import as `import { nanoid } from 'nanoid'`.
