# Secure SDLC Authentication Project

This repository contains a full-stack, secure React + FastAPI authenticating dashboard designed to demonstrate enterprise-grade protection mechanisms, RBAC, and input validation.

## Enterprise Security Features Included
1. **Zero-Trust Input Validation:** Native Python regex binding directly into the unified Pydantic data schemas guarantees all payloads dropping onto the backend contain strict complexity (Uppercases, lowercases, numbers, special characters).
2. **Cryptographic Salting:** PostgreSQL/SQLite passwords are cryptographically injected via `bcrypt` passlib schemes.
3. **Environment Isolation:** Zero credentials exist within the source history. Code dynamically targets `.env` keys.
4. **Decoupled Backend Logging:** Auth events inject into a standalone file `backend/logs/audit.log` distinct from DB trails for persistence.
5. **Strict RBAC Enforcement:** Backend API models strictly override all User creations to standard roles, protecting against payload spoofing.

---

## Installation Commands

Since all sensitive credentials are computationally excluded from tracking via `.gitignore`, you must establish your own local `.env` setup.

### 1. Setup the Backend Engine

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Duplicate the template variables
cp .env.example .env
```
*(Open `.env` and customize your auto-seeding credentials if needed!)*

```bash
# Boot the server (Will auto-seed your Admin user mapped above)
uvicorn app.main:app --reload
```

### 2. Setup the Frontend Client

```bash
cd frontend
npm install

# Duplicate the template networking coordinates 
cp .env.example .env

# Boot the React Application
npm run dev
```

Navigate your browser to `http://localhost:5173`. You can log directly into your system with the `DEFAULT_ADMIN_EMAIL` and `DEFAULT_ADMIN_PASSWORD` you provided to your backend `.env` file!

---

## 🐋 Quickstart with Docker (Recommended for Newbies)

To avoid manually installing Python, Node, and Postgres on your local machine, use our pre-configured Docker cluster!

1. **Install Docker Desktop:** Ensure [Docker Desktop](https://www.docker.com/products/docker-desktop/) is running.
2. **Duplicate the Environments:**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
3. **Boot the Cluster:**
   Open your terminal in the root folder (where `docker-compose.yml` is) and run:
   ```bash
   docker compose up --build -d
   ```
4. **Access the App:**
   - **Frontend UI:** Open your browser to [http://localhost:5173](http://localhost:5173). The React application is being securely served via an Nginx router.
   - **Backend API:** FastAPI connects directly to a pristine PostgreSQL database and exposes standard swagger docs at [http://localhost:8000/docs](http://localhost:8000/docs).

> **Note:** To shut down the cluster and wipe the database securely, simply run `docker compose down -v`.
