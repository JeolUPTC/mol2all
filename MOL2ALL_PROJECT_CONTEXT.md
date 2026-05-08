# MOL2ALL - Plataforma Educativa Gamificada para Estequiometría

## Descripción General del Proyecto
Mol2All es una plataforma educativa interactiva enfocada en la enseñanza de estequiometría, química básica y resolución de problemas científicos mediante gamificación.

El sistema debe combinar:
- Aprendizaje progresivo
- Videojuego educativo
- Gestión académica
- Seguimiento de progreso
- Sistema de usuarios
- Panel docente
- Posible funcionamiento como PWA
- Arquitectura modular y escalable

---

# Objetivos Principales

## Objetivo General
Desarrollar una plataforma educativa gamificada que permita enseñar estequiometría de manera interactiva, evaluable y escalable para estudiantes de educación media y superior.

## Objetivos Específicos
- Crear sistema de autenticación de usuarios
- Permitir roles:
  - Estudiante
  - Docente
  - Administrador
- Implementar niveles progresivos
- Diseñar motor de preguntas químicas
- Incorporar sistema de puntuación, vidas, energía y progreso
- Crear ruleta o sistema de selección aleatoria de retos
- Registrar estadísticas de desempeño
- Generar reportes académicos
- Integrar arquitectura limpia y mantenible

---

# Requisitos Funcionales

## Usuarios
- Registro
- Inicio de sesión
- Recuperación de contraseña
- Perfil
- Avatares

## Juego
- Niveles
- Misiones
- Sistema de vidas
- Puntos
- Energía
- Recompensas
- Logros

## Módulo Educativo
- Balanceo químico
- Masa molar
- Conversión mol-masa
- Reactivo límite
- Rendimiento porcentual
- Preguntas aleatorias
- Banco de preguntas

## Panel Docente
- Seguimiento por estudiante
- Resultados
- Estadísticas
- Gestión de contenidos
- Exportación de reportes

---

# Requisitos No Funcionales
- Responsive
- Mobile-first
- PWA
- Offline parcial
- Seguridad
- Escalabilidad
- Código mantenible
- Arquitectura modular
- Buen diseño UI/UX
- Internacionalización futura

---

# Arquitectura Recomendada

## Frontend
- React
- TypeScript
- Vite
- TailwindCSS
- Phaser.js (videojuego)
- React Router
- Zustand o Redux Toolkit

## Backend
- Node.js
- NestJS o Express modular
- PostgreSQL
- Prisma ORM
- JWT Auth
- Docker

## DevOps
- Docker Compose
- GitHub
- CI/CD
- Google Cloud o despliegue futuro

---

# Módulos Principales

## Core
- Usuarios
- Autenticación
- Roles

## Academic
- Preguntas
- Evaluaciones
- Resultados

## Game
- Escenas
- Progreso
- Recompensas
- Inventario
- Misiones

## Analytics
- Dashboard
- Reportes
- Métricas

---

# Diseño de Base de Datos Inicial

## Tablas sugeridas:
- users
- roles
- profiles
- levels
- questions
- answers
- achievements
- progress
- sessions
- teacher_reports

---

# Enfoque Pedagógico
- Aprendizaje basado en retos
- Refuerzo positivo
- Evaluación continua
- Gamificación
- Aprendizaje visual
- Motivación incremental

---

# Estilo Visual
- Científico
- Juvenil
- Moderno
- Arcade educativo
- Colores energéticos
- Dashboard profesional

---

# Prioridades de Desarrollo (Fases)

## Fase 1
- Arquitectura base
- Login
- Registro
- Dashboard
- Primer nivel jugable

## Fase 2
- Motor de preguntas
- Sistema de progreso
- Gamificación avanzada

## Fase 3
- Panel docente
- Reportes
- Optimización

## Fase 4
- PWA
- Offline
- Escalabilidad

---

# Restricciones
- Código limpio
- Sin soluciones improvisadas
- Escalable
- Modular
- Reutilizable
- Buenas prácticas de ingeniería
- Posibilidad de publicación académica futura

---

# Instrucciones para Claude AI
Actúa como:
- Arquitecto de software senior
- Ingeniero full stack
- Diseñador instruccional
- Especialista en gamificación educativa
- Experto en clean architecture

Ayúdame a:
- Diseñar el sistema paso a paso
- Generar código profesional
- Explicar decisiones técnicas
- Construir módulos completos
- Priorizar escalabilidad
- Mantener documentación técnica rigurosa
- Proponer mejoras reales

---

# Primera Tarea Solicitada
Diseñar la arquitectura completa inicial de Mol2All incluyendo:
- Estructura de carpetas
- Tecnologías
- Modelos de datos
- Roadmap técnico
- MVP funcional