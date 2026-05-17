# CutOff

Aplicación web moderna para la gestión y división de gastos compartidos en grupo. Crea grupos, agrega miembros, registra gastos individuales o compartidos, configura pagos recurrentes y a meses sin intereses, importa estados de cuenta vía XML/OCR, y visualiza resúmenes de facturación con una interfaz de vidrio líquido.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 (App Router), React 18, TypeScript, TailwindCSS |
| Backend | NestJS 11, TypeORM, PostgreSQL |
| Autenticación | JWT (Passport) |
| Estado | Zustand, TanStack Query |
| Contenedores | Docker Compose (PostgreSQL + pgAdmin) |

---

## Historias de Usuario

### Módulo de Autenticación

| ID | Historia | Criterios de Aceptación |
|---|---|---|
| US-001 | **Registro de usuario** — Como nuevo usuario, quiero registrarme con mi correo y contraseña para acceder a la plataforma | Formulario con validación; el registro crea la cuenta y redirige al dashboard |
| US-002 | **Inicio de sesión** — Como usuario registrado, quiero iniciar sesión para acceder a mis grupos y gastos | Login con email/contraseña; retorna JWT que se persiste en localStorage |
| US-003 | **Recuperación de contraseña** — Como usuario que olvidó su contraseña, quiero solicitar un reset para recuperar el acceso | Flujo forgot-password → email con token → reset-password |

### Módulo de Grupos

| ID | Historia | Criterios de Aceptación |
|---|---|---|
| US-004 | **Crear grupo** — Como usuario autenticado, quiero crear un grupo para invitar a otras personas a compartir gastos | Se genera un código único de invitación; el creador es el owner del grupo |
| US-005 | **Unirse a un grupo** — Como usuario, quiero unirme a un grupo existente mediante un código de invitación | Valida que el código exista; solicita aprobación del owner si es necesario |
| US-006 | **Gestionar miembros** — Como owner del grupo, quiero ver la lista de miembros y aprobar/rechazar solicitudes de ingreso | Panel con lista de miembros y estado (pendiente/activo/rechazado) |

### Módulo de Tarjetas

| ID | Historia | Criterios de Aceptación |
|---|---|---|
| US-011 | **Gestionar tarjetas** — Como owner del grupo, quiero crear, editar y eliminar tarjetas asociadas al grupo | CRUD completo; las tarjetas se usan en el registro de gastos |
| US-012 | **Asignar gasto a tarjeta** — Como miembro del grupo, quiero seleccionar una tarjeta al registrar un gasto para llevar el control por método de pago | Select de tarjetas disponibles en el grupo |

### Módulo de Gastos

| ID | Historia | Criterios de Aceptación |
|---|---|---|
| US-007 | **Registrar gasto individual** — Como miembro del grupo, quiero registrar un gasto con fecha, monto, concepto y tarjeta | Formulario con selección de tarjeta; el gasto se asigna al usuario logueado |
| US-008 | **Importar gastos desde XML/IMAGEN** — Como miembro del grupo, quiero subir un archivo XML de estado de cuenta (HSBC) o imagen (PNG/JPG) para importar múltiples gastos | Parseo del XML client-side; OCR via tesseract.js para imágenes; vista previa editable; guardado masivo |
| US-009 | **Listar y filtrar gastos** — Como miembro del grupo, quiero ver todos los gastos con opciones de filtro persistidas en la URL | Tabla con columnas de fecha, monto, concepto, usuario, tarjeta; filtros por rango de fechas, tarjeta, usuario y búsqueda por concepto; orden ASC por fecha; parámetros compartibles vía URL |
| US-010 | **Editar y eliminar gastos** — Como owner, quiero editar o eliminar gastos existentes para corregir errores | Edición con página dedicada `[expenseId]/edit`; eliminación individual o masiva con confirmación |
| US-016 | **Gasto compartido (split)** — Como miembro del grupo, quiero registrar un gasto dividido entre varios usuarios para que cada uno pague su parte | Selección de usuarios y montos por participante; la suma debe coincidir con el total; se crean N registros enlazados por `splitGroupId` |
| US-017 | **Gasto a meses sin intereses (MSI)** — Como miembro del grupo, quiero registrar un gasto a meses sin intereses para distribuir el pago en el tiempo | MSI y Recurrente son mutuamente excluyentes; se crean N registros con `installmentGroupId`; MSI+Split: cada mensualidad replica la distribución |
| US-018 | **Gasto recurrente** — Como miembro del grupo, quiero registrar un gasto que se repita cada mes durante N meses para automatizar renta, servicios, etc. | Se crean N registros con `recurringGroupId` vinculados; en edición se bloquean campos fijos del ciclo; Recurrente+Split: cada mes replica la distribución |
| US-019 | **Convertir gasto simple a compartido** — Como owner, quiero convertir un gasto individual existente en compartido desde la página de edición, pudiendo cambiar el monto total | Opción "Convertir a compartido" en edición; habilita spliteo; elimina el gasto original; crea N registros enlazados |
| US-020 | **Eliminar gasto recurrente (solo futuros)** — Como owner, quiero eliminar un gasto recurrente conservando el historial de meses pasados | Delete con cascade parcial: solo borra registros con `recurringCurrentMonth >= mes actual`; meses anteriores quedan como historial |
| US-021 | **Búsqueda por concepto** — Como miembro del grupo, quiero buscar gastos por texto parcial en el concepto para encontrar rápidamente un gasto específico | Backend con ILike; frontend con input de búsqueda + debouncer de 300ms; filtro `q` persistido en URL |

### Módulo de Facturación

| ID | Historia | Criterios de Aceptación |
|---|---|---|
| US-013 | **Resumen de facturación** — Como miembro del grupo, quiero ver un resumen de gastos agrupados por mes para entender los totales periódicos | Vista con selector de mes/año; tabla resumen con total por usuario y tarjeta |

### Generales

| ID | Historia | Criterios de Aceptación |
|---|---|---|
| US-014 | **Dashboard** — Como usuario, quiero un dashboard que muestre mis grupos activos y acceso rápido a cada uno | Tarjetas de grupo con nombre, código, cantidad de miembros; botones para acceder |
| US-015 | **Responsive design** — Como usuario mobile, quiero que la interfaz se adapte correctamente a mi pantalla | Layout funcional en tablets y teléfonos; tablas con scroll horizontal; menús adaptativos |
| US-022 | **Dark mode con accesibilidad** — Como usuario, quiero alternar entre tema claro y oscuro con controles accesibles | Toggle con `aria-pressed` y label dinámico; persistencia en localStorage; colores de autofill adaptados |
| US-023 | **Skip-to-content y navegación ARIA** — Como usuario de lector de pantalla, quiero saltar directamente al contenido principal y tener puntos de referencia ARIA | Skip-to-content link visible al focus; `aria-current="page"` en tabs; `<nav aria-label>` en navegación principal |

---

## Scripts disponibles

### Backend (`backend/`)

| Comando | Descripción |
|---|---|
| `npm run start:dev` | Servidor de desarrollo con recarga automática (puerto 3001) |
| `npm run build` | Compilación a `dist/` |
| `npm test` | Pruebas unitarias Jest |
| `npm run lint` | ESLint con corrección automática |
| `npm run format` | Prettier |

### Frontend (`frontend/`)

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (puerto 3000) |
| `npm run build` | Compilación producción |
| `npm run lint` | Next.js lint |

### Docker (producción)

```bash
docker-compose up --build -d
```

Construye e inicia todos los servicios:

| Servicio | Puerto | Acceso |
|---|---|---|
| **Frontend** (Next.js) | 3000 | http://localhost:3000 |
| **Backend** (NestJS) | 3001 | http://localhost:3001/api |
| **PostgreSQL** | 5432 | Solo interno (Docker network) |
| **pgAdmin** | 5050 | http://localhost:5050 (admin@admin.com / admin) |

### Desarrollo local

```bash
# 1. Iniciar solo base de datos
docker-compose up -d postgres

# 2. Backend (terminal 1)
cd backend
npm run start:dev

# 3. Frontend (terminal 2)
cd frontend
npm run dev
```

---

## Variables de Entorno

### Desarrollo local

Copiar `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=devuser
DB_PASSWORD=devpassword
DB_DATABASE=gastos_compartidos
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRES_IN=7d
PORT=3001
```

Y `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Producción (Docker)

Las variables se configuran en `docker-compose.yml`. El backend usa la variable `JWT_SECRET` del entorno del host (fallback a `dev-secret-key-change-in-production`). Se recomienda sobrescribirla:

```bash
JWT_SECRET=un-secreto-fuerte-aqui docker-compose up -d
```

---

## Estructura del Proyecto

```
gastos-compartidos/
├── backend/
│   └── src/
│       ├── common/              # Guards, decorators, filtros
│       ├── database/            # Configuración TypeORM
│       ├── modules/             # Módulos del negocio (NestJS)
│       │   ├── auth/
│       │   ├── billing/
│       │   ├── cards/
│       │   ├── expenses/
│       │   ├── groups/
│       │   ├── pdf-parser/
│       │   └── users/
│       └── main.ts
├── frontend/
│   └── src/
│       ├── app/                 # Next.js App Router (páginas — routing thin)
│       │   ├── groups/[groupId]/
│       │   │   ├── expenses/
│       │   │   │   ├── [expenseId]/edit/
│       │   │   │   └── new/
│       │   │   ├── cards/new/
│       │   │   ├── billing/
│       │   │   └── members/
│       │   ├── login/
│       │   ├── register/
│       │   ├── forgot-password/
│       │   ├── reset-password/
│       │   └── dashboard/
│       ├── features/            # Domains del negocio (screaming architecture)
│       │   ├── auth/
│       │   │   ├── store/       #   authStore (Zustand)
│       │   │   ├── hooks/       #   useAuth
│       │   │   └── components/  #   ProtectedRoute
│       │   ├── expenses/
│       │   │   ├── components/  #   ExpenseForm
│       │   │   └── hooks/       #   useExpenses, useExpense, useUpdateExpense, etc.
│       │   ├── groups/
│       │   │   ├── components/  #   GroupTabs, InviteCodeDisplay
│       │   │   └── hooks/       #   useGroups
│       │   ├── cards/
│       │   │   ├── components/  #   CardForm
│       │   │   └── hooks/       #   useCards
│       │   ├── billing/
│       │   │   ├── components/  #   BillingSummary
│       │   │   └── hooks/       #   useBilling
│       │   └── import/
│       │       ├── components/  #   XmlImportModal
│       │       └── lib/         #   parseFile, xml-parser
│       ├── shared/              # Infraestructura técnica compartida
│       │   ├── ui/              #   Button, Input, Select, Modal, Checkbox, Toggle, Badge, Skeleton
│       │   ├── components/      #   DataTable, Layout, ConfirmDialog, NavigationLoader
│       │   └── lib/             #   api (Axios), utils (cn)
│       ├── providers/           # Providers client-side (QueryClient, AuthInitializer, Toaster)
│       ├── stores/              # Stores genéricos (themeStore)
│       └── types/               # Tipos compartidos TypeScript
├── docker-compose.yml
├── .env
├── AGENTS.md
└── README.md
```

---

## Arquitectura

### Frontend: Screaming Architecture

El frontend organiza el código por **dominios de negocio** (`features/`) en lugar de por rol técnico:

```
src/
├── features/{auth,expenses,groups,cards,billing,import}/
│   ├── components/    ← Componentes de UI específicos del dominio
│   ├── hooks/         ← TanStack Query hooks + lógica de negocio
│   ├── store/         ← Zustand store del dominio (si aplica)
│   └── lib/           ← Utilidades del dominio
├── shared/{ui,components,lib}/  ← Código compartido entre dominios
├── app/               ← Solo routing (thin), delega en features
└── providers/         ↑ Composición de providers client-side
```

### Backend: NestJS Modular

El backend organiza por **módulos NestJS** en `src/modules/`. Cada módulo expone su controlador, servicio, entidad y DTOs. Guards compartidos en `common/`.

### Flujo de gastos compuestos

El motor de gastos soporta 5 combinaciones mediante composición de flags:

| `isInstallment` | `isRecurring` | `isSplit` | Comportamiento |
|---|---|---|---|
| ✗ | ✗ | ✗ | Gasto individual simple (1 registro) |
| ✓ | ✗ | ✗ | MSI (N registros, mismo `installmentGroupId`) |
| ✗ | ✓ | ✗ | Recurrente (N registros, mismo `recurringGroupId`, months tracked) |
| ✗ | ✗ | ✓ | Compartido (N registros, mismo `splitGroupId`, cada uno con monto parcelado) |
| ✓ | ✗ | ✓ | MSI + Split (cada mensualidad replica la distribución de splits) |
| ✗ | ✓ | ✓ | Recurrente + Split (cada mes replica la distribución de splits) |

**Reglas de negocio:**
- MSI y Recurrente son mutuamente excluyentes (`isInstallment && isRecurring` inválido)
- Eliminar un gasto recurrente solo borra meses futuros (`recurringCurrentMonth >= actual`); meses pasados quedan como historial
- Eliminar un gasto MSI o compartido borra todos los registros del grupo (`installmentGroupId` o `splitGroupId`)
- Solo el owner del grupo puede crear y editar gastos compartidos y recurrentes

---

## Decisiones Técnicas Clave

- **Modal → Radix Dialog**: Evita mount/unmount en cada apertura; se controla con CSS visibility en vez de render condicional
- **Filtros en URL**: Los parámetros (page, limit, card, from, to, q, user) se leen/escriben en `useSearchParams`, permitiendo compartir/enlazar el estado de la tabla
- **Debouncer de búsqueda**: Local state `searchInput` → 300ms → actualiza URL `q` → TanStack Query refetch automático
- **Fecha sin timezone**: Split directo del string `yyyy-MM-dd` en la tabla; nunca `new Date()` para evitar corrimiento por zona horaria
- **QueryClient estable**: `useState` en el provider, no module-level const (StrictMode safety)
- **Store selectores individuales**: `useAuthStore(s => s.user)` evita re-renders en componentes que solo leen una propiedad
- **No PDF**: Solo se aceptan PNG/JPG para OCR (tesseract.js) y XML (HSBC, parseo client-side)

---

## Accesibilidad

- Skip-to-content link (visible al recibir focus)
- `aria-current="page"` en tabs de navegación del grupo
- `aria-pressed` y `aria-label` en toggle de tema oscuro
- `role="status"` + `aria-live="polite"` en estados de carga
- Checkbox personalizado con `role="checkbox"`, `aria-checked`, manejo de teclado y `focus-visible`
- Navegación envuelta en `<nav aria-label="...">`
- Contraste suficiente en modo oscuro y claro; colores de autofill adaptados
