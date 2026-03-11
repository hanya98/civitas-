# Civitas - Public Grievance Management System (PGMS 2.0)

**Civitas** is a state-of-the-art, AI-powered digital platform designed to bridge the gap between citizens and government authorities. It provides a centralized ecosystem for lodging grievances, tracking public development, and fostering transparent governance.

---

## 🚀 Key Features

### For Citizens
- **Smart Grievance Registration**: A step-by-step form to report issues with photo/video attachment support.
- **AI-Powered Triage**: Automatic assessment of complaint priority based on category, history, and severity.
- **JanSetu Assistant**: A voice-activated AI assistant to help users navigate the portal and register complaints hands-free.
- **Real-Time Tracking**: Monitor the status of registered grievances from "Pending" to "Resolved".
- **Happiness Index**: Provide feedback on government services to help improve local governance.
- **Development Map**: Track ongoing and upcoming public projects in your vicinity.

### For Administrators
- **Comprehensive Dashboard**: Real-time overview of all complaints with advanced filtering and sorting.
- **AI Assignment**: Automated task assignment to relevant officials (Department Heads, Field Inspectors, Engineers) via Gemini AI.
- **Audit Trails**: Full history of actions, progress updates, and reassignments for every grievance.
- **Performance Analytics**: Track resolution rates, overdue tasks, and departmental performance.
- **Poll Management**: Create and manage local polls to gather citizen sentiment on specific issues or pincodes.

## 🤖 AI Integration (Gemini 2.0)
Civitas leverages Google’s **Gemini 2.0 Flash** to automate complex administrative tasks:
- **Priority Assessment**: Analyzes descriptions to detect life-threatening or urgent risks, escalating them to "High" priority.
- **Automated Assignment**: Dynamically assigns tasks to specific roles (e.g., "Field Inspector") based on the complaint category and location.
- **Intelligent Routing**: Factors in repeat reports for automatic escalation of chronic issues.

## 🛠 Technology Stack
- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+), GSAP (Animations).
- **Backend**: Node.js, Express.
- **Database**: Firebase Firestore (Real-time NoSQL storage).
- **AI Engine**: Google Gemini 2.0 Flash API.
- **Authentication**: Session-based authentication with role-based access control.

## 📂 Project Structure
```text
├── admin.html / .js / .css     # Admin Dashboard & Logic
├── citizen.html / .js / .css   # Citizen Portal & Grievance Form
├── index.html                   # Landing Page
├── server.js                   # Node.js API Proxy (Gemini integration)
├── auth.js                     # Shared Auth Utilities
├── jansetu-assistant.js / .css # Voice Assistant Module
├── schemes.html / .js / .css   # Policies & Schemes Discovery
└── happiness.html / .js        # Feedback & Sentiment Collection
```

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- Firebase Project (Firestore enabled)
- Gemini API Key

### Installation Steps
1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd seedtoscale
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Firebase Configuration:**
   - Update the Firebase config object in `citizen.html`, `admin.html`, and `tracking.html` with your project credentials.

5. **Start the server:**
   ```bash
   npm start
   ```

6. **Access the App:**
   - Citizen Portal: `http://localhost:3000/citizen.html`
   - Admin Dashboard: `http://localhost:3000/admin.html`

---

## 👥 Authors
Developed by **Team SeedtoScale** for the next generation of digital governance.
