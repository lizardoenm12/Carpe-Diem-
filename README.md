Link PDF Carpe Diem
https://drive.google.com/file/d/1T9_VNCtqhOYCfQ26F1UMfo0mHPf7EpUH/view?usp=sharing

# 🌿 Carpe Diem — Adaptive Study & Life Hub

> *"Oh Capitán, mi Capitán"* — Dead Poets Society

Carpe Diem es una aplicación web de estudio adaptativo inspirada en *Dead Poets Society*. Se adapta al estado emocional del usuario en tiempo real mediante un semáforo emocional, personalizando la experiencia de estudio con IA, poemas y herramientas organizativas.

Proyecto universitario Full Stack con IA — desarrollado con Next.js, Firebase y Gemini API.

---

## 🚀 Demo

> Video demo próximamente.

📄 [Documentación técnica completa](AQUÍ_TU_LINK_DE_GOOGLE_DRIVE)

---

## ✨ Funcionalidades principales

- **Semáforo emocional** — check-in diario que adapta colores, tono del asistente y poemas según cómo llega el usuario
- **El Capitán** — asistente IA con personalidad Keating, powered by Gemini, que ajusta su tono según el nivel emocional
- **Horario semanal** — grid visual interactivo con análisis de sobrecarga por IA
- **Calendario** — gestión de eventos con gradiente de urgencia y poema adaptativo
- **Apuntes** — organización de materias con archivos y chats del Capitán por tema
- **Juegos / Flashcards** — repaso adaptativo generado con IA por tema
- **Perfil** — preferencias de estudio, tono del asistente y foto de perfil
- **Poemas adaptativos** — fragmentos de poesía según el nivel emocional del día

---

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16 + TypeScript + Tailwind CSS |
| Auth | Firebase Authentication (Google OAuth) |
| Base de datos | Cloud Firestore |
| Almacenamiento | Firebase Storage |
| IA | Gemini API (gemini-1.5-flash) |
| Mobile | Kotlin / Android Studio |

---

## 📁 Estructura del proyecto
Carpe-Diem/
└── carpediem-web/
├── app/
│   ├── (panel)/
│   │   ├── dashboard/
│   │   ├── calendario/
│   │   ├── horario/
│   │   ├── capitan/
│   │   ├── apuntes/
│   │   ├── juegos/
│   │   └── perfil/
│   ├── api/
│   │   ├── capitan/
│   │   └── horario/
│   ├── onboarding/
│   └── checkin/
├── components/
├── lib/
│   ├── firebase.ts
│   ├── semaforo.ts
│   ├── poemas.ts
│   └── firestore_colections.ts
└── public/

---

## ⚙️ Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/lizardoenm12/Carpe-Diem-.git
cd Carpe-Diem-/carpediem-web
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Abre `.env.local` y completa con tus credenciales de Firebase y Gemini API.

> 🔑 **Firebase:** Firebase Console → Configuración del proyecto → Tus apps
> 🔑 **Gemini:** https://aistudio.google.com/app/apikey

### 4. Correr en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🔐 Variables de entorno

Ver [`.env.example`](.env.example) para la lista completa de variables requeridas.

**Importante:** nunca subas tu `.env.local` al repositorio. Está incluido en `.gitignore` por defecto.

---

## 🗄️ Colecciones de Firestore

| Colección | Descripción |
|-----------|-------------|
| `checkins/{uid_fecha}` | Estado emocional diario del usuario |
| `eventos/{id}` | Eventos del calendario |
| `horarios/{uid}` | Semana típica de actividades |
| `subjects/{id}` | Materias del usuario |
| `subjectFiles/{id}` | Archivos por materia |
| `subjectChats/{id}` | Conversaciones del Capitán por materia |
| `subjectTopics/{id}` | Temas con semáforo de dominio |
| `flashcards/{id}` | Flashcards generadas por IA |
| `userProfiles/{uid}` | Preferencias y perfil del usuario |

---

## 🤖 API Routes

| Ruta | Descripción |
|------|-------------|
| `POST /api/capitan` | Chat con El Capitán — Gemini con personalidad Keating |
| `POST /api/horario` | Análisis de horario semanal con recomendaciones adaptativas |

---

## 👩‍💻 Equipo

| Rol | Responsabilidad |
|-----|----------------|
| Jess | Frontend web, IA, Firebase, diseño adaptativo |
| Compañero | Aplicación móvil Kotlin / Android Studio |

---

## 📄 Licencia

Proyecto universitario — todos los derechos reservados.

🎥 [Video demo](TU_LINK_AQUÍ)
