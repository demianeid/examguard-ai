<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&height=180&color=0:0F172A,100:1E3A8A&text=ExamGuard%20AI&fontSize=48&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Intelligent%20AI-Powered%20Examination%20Proctoring%20System&descAlignY=58&descSize=17" width="100%"/>

<p>
An end-to-end platform for monitoring online and offline exams in real time — combining computer vision, behavioral risk scoring, and live alerts to help institutions run secure, fair exams.
</p>

<p>
<img src="https://img.shields.io/badge/status-graduation%20project-blue?style=flat-square"/>
<img src="https://img.shields.io/badge/license-unspecified-lightgrey?style=flat-square"/>
<img src="https://img.shields.io/github/last-commit/demianeid/examguard-ai?style=flat-square&color=176ADA"/>
</p>

<p>
<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB"/>
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"/>
<img src="https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white"/>
<img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white"/>
<img src="https://img.shields.io/badge/WebSockets-black?style=for-the-badge&logo=websocket&logoColor=white"/>
<img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white"/>
</p>

</div>

<br>

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Roadmap](#roadmap)
- [My Role](#my-role)
- [License](#license)

<br>

## Overview

**ExamGuard AI** is a graduation project built to tackle exam integrity in both **online** and **offline (in-hall)** settings. It gives instructors real-time visibility into student behavior during exams, using AI-driven detection to flag suspicious activity as it happens — instead of relying on manual, after-the-fact review.

The system pairs a **React + TypeScript** frontend for student and instructor workflows with a **Django** backend that runs a dedicated AI detection pipeline over live camera feeds, streaming violation events back to instructors in real time over WebSockets.

<br>

## Key Features

<table>
<tr>
<td width="50%" valign="top">

**🎯 Real-Time AI Monitoring**
Gaze and head-pose tracking, multiple-face detection, and unauthorized-device detection during live exams.

**🖥️ Online & Offline Modes**
Supports remote exam proctoring as well as in-hall monitoring via connected cameras and seat mapping.

**⚡ Live Violation Alerts**
Instructors receive real-time notifications over WebSockets the moment a violation is detected.

</td>
<td width="50%" valign="top">

**📊 Risk Scoring Engine**
Behavioral events are aggregated into a per-student risk score for fast, prioritized review.

**🔐 Face Recognition Auth**
Identity verification at session start to confirm the right student is taking the exam.

**🗂️ Exam & Class Management**
Create exams, assign students, and manage classes, enrollments, and reminders end-to-end.

</td>
</tr>
</table>

<br>

## Architecture

```
examguard-ai/
├── Frontend/                    React + TypeScript client
│   └── src/
│       ├── pages/                Student, instructor & admin views
│       ├── context/              Global app state (auth, user)
│       ├── services/             API integration layer
│       └── styles/               Theming
│
└── Backend/                    Django REST API
    ├── authentication/          Auth, profiles, face embeddings
    ├── exam/                    Exam creation, sessions, results
    ├── student/                 Student-specific models & views
    ├── instructors/             Class & instructor management
    ├── face/                    Face recognition service
    ├── violation_Exam/          Violation logging & risk engine
    ├── notifications/           Real-time & scheduled notifications
    ├── hardware/
    │   ├── ai_engine/            Detection models (face, head-pose, phone)
    │   ├── ai_detection/         WebSocket consumers for live detection
    │   ├── camera_stream/        Camera / exam-hall management
    │   ├── frame_dispatcher/     Frame routing & background tasks
    │   ├── offline_monitoring/   In-hall exam & seating management
    │   └── runpod_worker/        GPU inference worker (deployed separately)
    └── backend/                  Django project settings & root URLs
```

> The AI detection pipeline runs as an independent worker that processes camera frames and pushes violation events back to the backend in real time — keeping the exam-taking experience responsive while heavy inference runs in the background.

<br>

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React · TypeScript · Vite · Tailwind CSS |
| **Backend** | Django · Django REST Framework · Django Channels |
| **Database** | PostgreSQL |
| **Real-Time** | WebSockets |
| **Background Jobs** | Celery |
| **AI / Computer Vision** | Face detection · head-pose estimation · device detection |
| **Deployment** | RunPod (GPU inference worker) |

<br>

## Getting Started

### Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 18+ |
| Python | 3.12+ |
| PostgreSQL | 14+ |

### 1. Clone the repository

```bash
git clone https://github.com/demianeid/examguard-ai.git
cd examguard-ai
```

### 2. Backend setup

```bash
cd Backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

pip install -r requirements.txt
cp .env.example .env           # then fill in your environment variables
python manage.py migrate
python manage.py runserver
```

### 3. Frontend setup

```bash
cd Frontend
npm install
npm run dev
```

By default, the frontend runs at `http://localhost:5173` and the backend API at `http://localhost:8000`.

<br>

## Environment Variables

The backend expects a `.env` file (see `.env.example` for the full list), typically including:

```env
SECRET_KEY=
DEBUG=
DATABASE_URL=
ALLOWED_HOSTS=
```

<br>

## Roadmap

- [ ] Public deployment / live demo
- [ ] Automated test coverage for the AI detection pipeline
- [ ] Instructor analytics dashboard
- [ ] Mobile-friendly student view

<br>

## My Role

**Team Leader & Frontend Developer**

- Led the development team throughout the project lifecycle
- Built responsive, component-based interfaces for student and instructor workflows using React, TypeScript, and Tailwind CSS
- Owned UI/UX decisions, with a focus on usability and real-time monitoring views
- Integrated the frontend with WebSocket-based live violation alerts and AI detection results

<br>

## License

This project was developed as a graduation project. License to be determined.

<br>

<div align="center">
<sub>Built with 💙 as part of a Computer Science graduation project.</sub>
</div>
