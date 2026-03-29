# LoremIpsum Secure: Security Architecture & Implementation Rubric

This document serves as a comprehensive overview of the enterprise-grade security mechanisms integrated into the application. It breaks down every defensive layer spanning Authentication, Database Management, Input Validation, and Cryptography.

---

## 1. Authentication & Session Management

**A. HttpOnly JWT Cookies**
- **Implementation:** Traditional `localStorage` tokens are severely vulnerable to Cross-Site Scripting (XSS). This application mathematically binds the `JSON Web Token (JWT)` directly into a heavily restricted `HttpOnly`, `SameSite=Lax` cookie via the backend. The browser physically refuses to let JavaScript touch the session token, neutralizing XSS theft natively.

**B. Server-Side Session Revocation (JTI Binding)**
- **Implementation:** Standard JWTs cannot be revoked until they expire. To counter this, every active session issues a unique `JTI` (JWT ID) that is synchronized directly to the user's database profile (`active_session_jti`). If an Admin disables an account, or a user logs out, the backend instantly deletes this database key, physically invalidating the cookie across the network without waiting for mathematical expiration.

**C. Password Hashing**
- **Implementation:** Passwords are never stored in plaintext or logged. They are salted and strictly hashed using `Bcrypt` (via `passlib`) before resting in the database.

---

## 2. Brute-Force Defenses & Enumeration

**A. API Network Rate-Limiting**
- **Implementation:** Powered by `SlowAPI`, specific high-value targets (like `/auth/login`) dynamically track incoming IPs. Exceeding 5 requests per minute instantly triggers an `HTTP 429 Too Many Requests` network drop, destroying automated bot swarms before they even query the database.

**B. Mutating Database Lockouts**
- **Implementation:** If a human attacker systematically guesses 5 incorrect passwords sequentially, the system mathematically locks out the account natively via the database (`locked_until`). It cuts backend execution with an `HTTP 403 Forbidden` Exception, dynamically driving a live 60-second React countdown UI rendering the attacker completely halted until expiration.

**C. Zero-Leak User Enumeration Prevention**
- **Implementation:** To stop hackers from deducing which emails belong to valid targets, the login pipeline guarantees uniform obfuscation. Whether you guess a completely fake email, type the wrong password, or attempt to log into a manually disabled/inactive account, the system strictly returns the exact same generic string: `"Incorrect username or password"`. 

---

## 3. Principle of Least Privilege & Access Control

**A. Unprivileged OS Container Execution**
- **Implementation:** Deploying web servers as Linux `root` is a critical Zero-Day vulnerability. The React Dockerfile entirely bypasses system-level root execution by strictly extending the `nginxinc/nginx-unprivileged:alpine` image. The container routes internet traffic structurally downstream into a restricted user's `8080` port mapping.

**B. Database Role Segregation (Read-Only Separation)**
- **Implementation:** The application does not connect to the database via Superuser. It implements extreme trust separation: standard application duties utilize an `app_user` with restricted bindings, while purely analytical endpoints (like reading the Audit Ledger) utilize a completely severed `read_only_user` connection pool. Even if a SQL injection was theoretically discovered on an Admin dashboard route, it is physically impossible for the attacker to mutate data.

**C. Revoked Table Mutability**
- **Implementation:** The backend application physically lacks `INSERT` and `UPDATE` permissions over the `audit_logs` SQL table. To safely record ledgers, the application mathematically invokes a strict `SECURITY DEFINER` Postgres Stored Procedure compiled by the Admin! 

---

## 4. Cryptographic Blockchain Immutable Ledger

**A. Deep Audit Tracking**
- **Implementation:** Every critical network boundary (`LOGIN_SUCCESS`, `ACCESS_VIOLATION`, `FILE_UPLOADED`) forces a ledger log alongside the instigating Hacker's IP Address.

**B. The Mathematical Hashing Sequence**
- **Implementation:** The Ledger strictly acts like a blockchain. Every row calculates a `SHA-256` signature binding the action payload explicitly explicitly with the underlying signature belonging to the row before it (`previous_hash`). 

**C. Native Tamper Detection Engine**
- **Implementation:** On every single query, the Python Engine dynamically recalculates the exact `SHA-256` math of the physical SQL text payloads. If a Database Superuser manually `UPDATES` a ledger row to hide their tracks, the string inherently mutates the hash payload, instantly setting off a massive, cascading `TAMPER DETECTED!` sequence across the React application, mathematically guaranteeing Detection.

---

## 5. Input Validation & Data Boundaries

**A. Error Obfuscation (No Stack Traces)**
- **Implementation:** The Python core deploys a `Global Exception Handler`. It intercepts all severe `HTTP 500` and Pydantic `HTTP 422` schema validations, cleanly ripping out massive Tracebacks and converting them into safe, sanitized strings like `Validation Error on 'email'`. The real Traceback is silently injected inside the Immutable Ledger for safe Admin auditing. 

**B. File Upload Constraint Architectures**
- **Implementation:** The network safely clamps attachments at `5 Megabytes`, structurally disabling the frontend React `Submit` UI via state logic if no file payload is injected, preventing NULL-byte sweeps.

**C. Binary Magic Byte Verification**
- **Implementation:** Relying on `.pdf` string extensions is dangerous. The Python `scanner.py` intercepts the raw file payload array and dynamically validates the exact OS-level "Magic Bytes" (Byte Signatures) of PDFs and Images to mathematically prove their composition before continuing the upload phase. Sensitive fields are subsequently encrypted at rest using `AES-GCM`!
