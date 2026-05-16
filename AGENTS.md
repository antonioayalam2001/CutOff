# AGENTS.md

## Project structure
- Monorepo: `backend/` (NestJS 11 + TypeORM + PostgreSQL), `frontend/` (Next.js 16 App Router + TailwindCSS)
- Docker: `docker-compose up -d` starts postgres (5432) + pgadmin (5050, admin@admin.com/admin)
- Root `.env` holds DB and JWT config. Backend loads it via `@nestjs/config`.
- Backend version: NestJS 11, bcrypt 6, nanoid 3.3.7 (CJS). Frontend: Next.js 16.2.6, React 18.

## Backend (NestJS)
- **Global prefix**: `api` set in `main.ts`. Controllers use `@Controller('auth')` NOT `@Controller('api/auth')`.
- **Port**: `process.env.PORT || 3001`
- **Path aliases**: `@common/*`, `@modules/*`, `@database/*` → `src/common/`, `src/modules/`, `src/database/`
- **Database**: `synchronize: true` in DatabaseModule — schema auto-syncs from entity files. Entities are auto-loaded via glob pattern.
- **Auth**: JWT via passport. Token in `Authorization: Bearer <token>` header. `expiresIn` needs `as any` cast (NestJS 11 type strictness).
- **Guards requiring GroupsModule**: `GroupMemberGuard` and `GroupOwnerGuard` use `@InjectRepository()`. Any module whose controller uses these guards **must import `GroupsModule`**.
- **Modules**: `auth`, `users`, `groups`, `cards`, `expenses`, `billing`, `pdf-parser`. `CardsModule`, `ExpensesModule`, `BillingModule` all import `GroupsModule`.
- **PdfParser (`POST /parse-file`)**: ONLY accepts PNG/JPG → tesseract.js OCR. No PDF support. No `bankProfileId` required. No pdfjs-dist or canvas deps.

### Commands (run from `backend/`)
| Command | Action |
|---|---|
| `npm run start:dev` | Dev server with watch on :3001 |
| `npm run build` | Compile to `dist/` |
| `npm test` | Jest unit tests (`*.spec.ts`) |
| `npm run lint` | ESLint with `--fix` |
| `npm run format` | Prettier |

## Frontend (Next.js)
- **API client**: `src/lib/api.ts` — Axios instance, baseURL `http://localhost:3001/api`, auto-attaches JWT from localStorage, redirects to `/login` on 401.
- **State**: Zustand (`authStore.ts`, `themeStore.ts`) for auth/theme. TanStack Query for server state.
- **UI components**: `src/components/ui/` (Button, Input, Badge, Modal, Select, Skeleton, dialog).
- **Auth flow**: Register/Login pages call authStore → POST `/auth/register` or `/auth/login` → JWT + user saved to localStorage.
- **Routes**: `/` → landing, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/dashboard`, `/dashboard/join`, `/groups/[groupId]`, `/groups/[groupId]/{expenses,members,cards,billing}`
- **Import flow**: HSBC card → XML client-side parse (`parseXml`) + optional images; other cards → images only via `parseFile()` (POST `/parse-file`). `parseFile()` uses `'generico'` as default `bankProfileId`.
- **NavigationLoader**: Top progress bar on route changes, tracks `usePathname`.

### Commands (run from `frontend/`)
| Command | Action |
|---|---|
| `npm run dev` | Dev server on :3000 |
| `npm run build` | Production build |
| `npm run lint` | `next lint` |

## Common gotchas
1. **Double `/api` prefix**: `main.ts` sets global prefix `api`. Controller paths must NOT include it.
2. **Group guards need GroupsModule**: A guard like `GroupMemberGuard` requires the containing module to `imports: [GroupsModule]`.
3. **TypeORM synchronize**: Schema auto-applied on startup. No migrations in dev.
4. **Backend :3001, frontend :3000**. CORS configured for `localhost:3000`.
5. **New backend modules**: Register in `app.module.ts`, add entity to `TypeOrmModule.forFeature()` if needed.
6. **`nanoid` v3 CJS**: Import as `import { nanoid } from 'nanoid'`.
7. **NestJS 11 `expiresIn`**: `signOptions: { expiresIn: process.env.JWT_EXPIRES_IN as any }` — type-stricter `@types/jsonwebtoken`.
8. **PostCSS override**: Next.js 16.2.6 bundles postcss 8.4.31 (vuln). `"overrides": { "postcss": "8.5.14" }` in root `package.json` fixes it.
9. **PDF removed**: No PDF support anywhere. Only images (PNG/JPG) and XML (client-side, HSBC only).
