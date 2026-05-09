# MOL2ALL — Plataforma Educativa Gamificada de Estequiometría

Plataforma web que enseña estequiometría a través de un videojuego de plataformas 2D. Los estudiantes avanzan por niveles respondiendo preguntas de química; los docentes crean y gestionan grupos y preguntas; los administradores moderan el contenido y supervisan analíticas.

**Demo en producción:** https://mol2all.com

---

## Requisitos previos

| Herramienta | Versión mínima | Descarga |
|---|---|---|
| Node.js | 20 LTS | https://nodejs.org |
| PostgreSQL | 15+ | https://www.postgresql.org |
| Git | cualquiera | https://git-scm.com |

> **Alternativa:** Si tiene Docker instalado, puede omitir PostgreSQL y usar la opción Docker Compose al final de esta sección.

---

## Instalación manual (paso a paso)

### 1. Clonar el repositorio

```bash
git clone https://github.com/JeolUPTC/mol2all.git
cd mol2all
```

### 2. Configurar el backend

```bash
cd backend
cp .env.example .env
```

Abra `backend/.env` y edite únicamente la línea `DATABASE_URL` con los datos de su base de datos local:

```env
DATABASE_URL=postgresql://USUARIO:CONTRASEÑA@localhost:5432/mol2all
```

El resto de los valores del `.env.example` funcionan tal como están para desarrollo local.

> Si PostgreSQL está recién instalado, cree la base de datos antes de continuar:
> ```sql
> -- Ejecute en psql o pgAdmin
> CREATE DATABASE mol2all;
> ```

### 3. Instalar dependencias del backend

```bash
# (desde backend/)
npm install
```

### 4. Crear las tablas y poblar la base de datos

```bash
npx prisma db push
npx prisma generate
npx ts-node prisma/seed.ts
```

El seed crea automáticamente toda la información necesaria para usar la plataforma:

| Dato | Detalle |
|---|---|
| **6 niveles** | Masa Molar → Balanceo → Estequiometría Básica → Reactivo Límite → Rendimiento Porcentual → Maestro Químico |
| **Preguntas** | ~8–10 preguntas por nivel (selección múltiple, numérica, balanceo, emparejamiento) |
| **Logros** | Sistema de logros con 8 insignias desbloqueables |
| **Usuarios de prueba** | Ver tabla de credenciales abajo |

#### Credenciales creadas por el seed

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@mol2all.com | admin1234 |
| Docente | docente@mol2all.com | teacher1234 |
| Estudiante | estudiante@mol2all.com | student1234 |
| Estudiante | maria@mol2all.com | student1234 |

> **Importante:** Cambie estas contraseñas si va a exponer la plataforma fuera de un entorno local.

### 5. Iniciar el backend

```bash
# (desde backend/)
npm run start:dev
```

El servidor queda disponible en **http://localhost:3000**  
La documentación Swagger de la API está en **http://localhost:3000/api/docs**

### 6. Configurar e iniciar el frontend

Abra una nueva terminal:

```bash
cd frontend
```

Cree el archivo de entorno del frontend:

```bash
# Windows PowerShell
echo "VITE_API_URL=http://localhost:3000" > .env

# macOS / Linux
echo "VITE_API_URL=http://localhost:3000" > .env
```

Instale dependencias e inicie:

```bash
npm install
npm run dev
```

La aplicación queda disponible en **http://localhost:5173**

---

## Instalación con Docker Compose (alternativa)

Si tiene Docker y Docker Compose instalados:

```bash
# Desde la raíz del proyecto
docker compose up -d
```

Esto levanta PostgreSQL, el backend y el frontend automáticamente.  
Luego ejecute el seed **una sola vez**:

```bash
docker exec mol2all_backend npx ts-node prisma/seed.ts
```

La aplicación queda disponible en **http://localhost:5173**

---

## Limitaciones conocidas de la versión actual

| Funcionalidad | Estado | Detalle |
|---|---|---|
| **Envío de correos** | No configurado por defecto | La recuperación de contraseña está implementada con Nodemailer pero requiere configurar variables SMTP. En desarrollo, el enlace de recuperación aparece en la consola del servidor en lugar de enviarse por correo. |
| **Tabla periódica** | Períodos 1–5 únicamente | Cubre los primeros 54 elementos (H–Xe). Los elementos de períodos 6 y 7 no están incluidos. |
| **Registro público** | Deshabilitado por diseño | Los estudiantes los crea el docente; los docentes los crea el administrador. No existe registro libre. |

### Habilitar el envío de correos (opcional)

Agregue estas variables al archivo `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=su-correo@gmail.com
SMTP_PASS=su-contraseña-de-aplicacion
SMTP_FROM=MOL2ALL <su-correo@gmail.com>
```

Para Gmail, genere una **contraseña de aplicación** en: Cuenta de Google → Seguridad → Contraseñas de aplicación (requiere verificación en dos pasos activa).

---

## Tecnologías principales

| Capa | Tecnologías |
|---|---|
| Frontend | React 18, Vite, TypeScript, Phaser 3, Zustand, TailwindCSS |
| Backend | NestJS 10, Node.js 20, TypeScript, Prisma ORM |
| Base de datos | PostgreSQL 15+ |
| Despliegue | Vercel (frontend) · Railway (backend + BD) |

---

## Estructura del proyecto

```
mol2all/
├── backend/          # API REST — NestJS + Prisma
│   ├── prisma/       # Esquema de BD y seed de datos iniciales
│   └── src/          # Módulos: auth, users, levels, questions, game, ...
├── frontend/         # SPA React + videojuego Phaser 3
│   └── src/          # Módulos: auth, dashboard, game, teacher, admin, ...
├── docker-compose.yml
└── README.md
```

---

## Autor

Jorge Otalora — Universidad Pedagógica y Tecnológica de Colombia (UPTC)  
Repositorio: https://github.com/JeolUPTC/mol2all
