# Gastos Compartidos

Aplicación web para la gestión de gastos compartidos en grupo. Permite crear grupos, agregar miembros, registrar gastos, asignar tarjetas y visualizar resúmenes de facturación.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, TailwindCSS |
| Backend | NestJS 10, TypeORM, PostgreSQL |
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

### Módulo de Gastos

| ID | Historia | Criterios de Aceptación |
|---|---|---|
| US-007 | **Registrar gasto individual** — Como miembro del grupo, quiero registrar un gasto con fecha, monto, concepto y tarjeta | Formulario con selección de tarjeta; el gasto se asigna al usuario logueado |
| US-008 | **Importar gastos desde XML** — Como miembro del grupo, quiero subir un archivo XML de estado de cuenta para importar múltiples gastos a la vez | Parseo del XML; vista previa editable; asignación de usuario por gasto; guardado masivo |
| US-009 | **Listar y filtrar gastos** — Como miembro del grupo, quiero ver todos los gastos del grupo con opciones de filtrado por fecha | Tabla con columnas de fecha, monto, concepto, usuario, tarjeta; filtros por rango de fechas |
| US-010 | **Editar y eliminar gastos** — Como owner, quiero editar o eliminar gastos existentes para corregir errores | Edición inline o modal; eliminación individual o masiva con confirmación |

### Módulo de Tarjetas

| ID | Historia | Criterios de Aceptación |
|---|---|---|
| US-011 | **Gestionar tarjetas** — Como owner del grupo, quiero crear, editar y eliminar tarjetas asociadas al grupo | CRUD completo; las tarjetas se usan en el registro de gastos |
| US-012 | **Asignar gasto a tarjeta** — Como miembro del grupo, quiero seleccionar una tarjeta al registrar un gasto para llevar el control por método de pago | Select de tarjetas disponibles en el grupo |

### Módulo de Facturación

| ID | Historia | Criterios de Aceptación |
|---|---|---|
| US-013 | **Resumen de facturación** — Como miembro del grupo, quiero ver un resumen de gastos agrupados por mes para entender los totales periodicos | Vista con selector de mes/año; tabla resumen con total por usuario y tarjeta |

### Generales

| ID | Historia | Criterios de Aceptación |
|---|---|---|
| US-014 | **Dashboard** — Como usuario, quiero un dashboard que muestre mis grupos activos y acceso rápido a cada uno | Tarjetas de grupo con nombre, código, cantidad de miembros; botones para acceder |
| US-015 | **Responsive design** — Como usuario mobile, quiero que la interfaz se adapte correctamente a mi pantalla | Layout funcional en tablets y telefonos; tablas con scroll horizontal; menús adaptativos |

---

## Scripts disponibles

### Backend (`backend/`)

| Comando | Descripción |
|---|---|
| `npm run start:dev` | Servidor de desarrollo con recarga automática (puerto 3001) |
| `npm run build` | Compilación a `dist/` |
| `npm test` | Pruebas unitarias Jest |
| `npm run lint` | ESLint con corrección automática |

### Frontend (`frontend/`)

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (puerto 3000) |
| `npm run build` | Compilación producción |
| `npm run lint` | Next.js lint |

### Docker

```bash
docker-compose up -d
```

Inicia PostgreSQL (puerto 5432) y pgAdmin (puerto 5050, admin@admin.com / admin).

---

## Variables de Entorno

Copiar `.env` en la raíz del proyecto:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=gastos_compartidos
JWT_SECRET=tu_secreto_jwt
```

---

## Estructura del Proyecto

```
gastos-compartidos/
├── backend/
│   └── src/
│       ├── common/          # Guards, decorators, filtros
│       ├── database/        # Configuración TypeORM
│       ├── modules/         # Módulos del negocio
│       │   ├── auth/
│       │   ├── billing/
│       │   ├── cards/
│       │   ├── expenses/
│       │   ├── groups/
│       │   └── users/
│       └── main.ts
├── frontend/
│   └── src/
│       ├── app/             # Next.js App Router (páginas)
│       ├── components/      # Componentes compartidos
│       ├── hooks/
│       ├── lib/             # Utilidades, API client
│       ├── stores/          # Zustand stores
│       └── types/           # TypeScript types
├── docker-compose.yml
├── .env
└── AGENTS.md
```
