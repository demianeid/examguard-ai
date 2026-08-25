<div align="center">

# 🛡️ ExamGuard AI

**Intelligent AI-Powered Examination Proctoring System**

An end-to-end platform for monitoring online and offline exams in real time — combining computer vision, behavioral risk scoring, and live alerts to help institutions run secure, fair exams.

<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB"/>
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
<img src="https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white"/>
<img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white"/>
<img src="https://img.shields.io/badge/WebSockets-black?style=for-the-badge&logo=websocket&logoColor=white"/>

</div>

---

## 📖 Overview

**ExamGuard AI** is a graduation project built to tackle exam integrity in both **online** and **offline (in-hall)** settings. It gives instructors real-time visibility into student behavior during exams, using AI-driven detection to flag suspicious activity as it happens — instead of relying on manual, after-the-fact review.

The system pairs a **React + TypeScript** frontend for student and instructor workflows with a **Django** backend that runs a dedicated AI detection pipeline over live camera feeds.

---

## ✨ Key Features

- **Real-time AI monitoring** — gaze and head-pose tracking, multiple-face detection, and unauthorized-device detection during live exams
- **Online & offline modes** — supports remote exam proctoring as well as in-hall monitoring via connected cameras
- **Live violation alerts** — instructors receive real-time notifications over WebSockets as violations are detected
- **Risk scoring engine** — behavioral events are aggregated into a per-student risk score for fast review
- **Role-based dashboards** — separate workflows for students, instructors, and administrators
- **Exam & class management** — create exams, assign students, manage classes and enrollments
- **Notifications system** — in-app and scheduled reminders for upcoming exams
- **Face recognition authentication** — identity verification for exam sessions

---

## 🏗️ Architecture

```
examguard-ai/
├── Frontend/                  # React + TypeScript client
│   └── src/
│       ├── pages/              # Student, instructor & admin views
│       ├── context/             # Global app state (auth, user)
│       ├── services/            # API integration layer
│       └── styles/              # Theming
│
└── Backend/                   # Django REST API
    ├── authentication/         # Auth, profiles, face embeddings
    ├── exam/                   # Exam creation, sessions, results
    ├── student/                # Student-specific models & views
    ├── instructors/            # Class & instructor management
    ├── face/                   # Face recognition service
    ├── violation_Exam/         # Violation logging & risk engine
    ├── notifications/          # Real-time & scheduled notifications
    ├── hardware/
    │   ├── ai_engine/           # Detection models (face, head-pose, phone)
    │   ├── ai_detection/        # WebSocket consumers for live detection
    │   ├── camera_stream/       # Camera/exam-hall management
    │   ├── frame_dispatcher/    # Frame routing & background tasks
    │   ├── offline_monitoring/  # In-hall exam & seating management
    │   └── runpod_worker/       # GPU inference worker (deployed separately)
    └── backend/                 # Django project settings & root URLs
```

The AI detection pipeline runs as an independent worker that processes camera frames and pushes violation events back to the backend in real time, keeping the exam-taking experience responsive even while heavy inference runs in the background.

---

## 🧰 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React, TypeScript, Vite, Tailwind CSS |
| **Backend** | Django, Django REST Framework, Django Channels (WebSockets) |
| **Database** | PostgreSQL |
| **AI / Computer Vision** | Face detection, head-pose estimation, phone/device detection |
| **Async & Real-time** | WebSockets, Celery (background tasks) |
| **Deployment** | RunPod (GPU inference worker) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- Python (3.12+)
- PostgreSQL
- A virtual environment tool (`venv`)

### 1. Clone the repository

```bash
git clone https://github.com/demianeid/examguard-ai.git
cd examguard-ai
```

### 2. Backend setup

```bash
cd Backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
cp .env.example .env         # then fill in your environment variables
python manage.py migrate
python manage.py runserver
```

### 3. Frontend setup

```bash
cd Frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173` and the backend API on `http://localhost:8000` by default.

---

## 👤 My Role

**Team Leader & Frontend Developer**

- Led the development team throughout the project lifecycle
- Built responsive, component-based interfaces for student and instructor workflows using React, TypeScript, and Tailwind CSS
- Owned UI/UX decisions, focusing on usability and real-time monitoring views
- Integrated the frontend with WebSocket-based live violation alerts and AI detection results

---

## 📄 License

This project was developed as a graduation project. License to be determined.
