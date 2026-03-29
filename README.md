# LoremIpsum Secure Application

This repository contains a full-stack, secure React + FastAPI authenticating dashboard strictly hardened to demonstrate enterprise-grade protection mechanisms, principle of least privilege, and cryptographic immutability.

## Enterprise Security Features Included
1. **Zero-Trust Input Validation:** Native Python validation strictly maps and restricts data payloads to prevent memory buffer exhaustion.
2. **Cryptographic Salting:** PostgreSQL passwords are cryptographically injected via `bcrypt` passlib schemes.
3. **Environment Isolation:** Zero credentials exist within the source history. Code dynamically targets `.env` keys bridged securely across the Docker subnet.
4. **Immutable Blockchain Ledger:** Auth events cleanly inject into a standalone JSON audit table mathematically secured via SHA-256 genesis chaining.
5. **Least Privilege Containerization:** NGINX executes identically under isolated constraints running non-root ports (8080) internally.

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
2. **Setup the Unified Cryptographic Environment:**
   Run this in the root folder of the project to generate the secure variables for the cluster.
   ```bash
   cp .env.example .env
   ```
3. **Boot the Cluster:**
   Open your terminal in the root folder (where `docker-compose.yml` is) and run:
   ```bash
   docker compose up --build -d
   ```
4. **Access the App:**
   - **Frontend UI:** Open your browser to [http://localhost:5173](http://localhost:5173). The React application is being securely served via a Least-Privilege NGINX router running unprivileged on port 8080 internally.
   - **Backend API:** FastAPI connects directly to a pristine PostgreSQL database. *(Note: Swagger OpenAPI documentation has been **Disabled** per strict academic security requirements to prevent API topology leaking).*

> **Note:** To shut down the cluster and wipe the database securely, simply run `docker compose down -v`.
