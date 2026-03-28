# Access Control & Authorization Policy
*Version 1.0 - Hardened for Enterprise Security Standards*

## 1. Overview
This document enforces the business logic, transaction limits, and strict Role-Based Access Control (RBAC) implementations utilized by the Secure Feedback System. All authorization controls are governed on the **Trusted Server Backend**.

## 2. Infrastructure "Least Privilege" Boundary
To prevent total infrastructure collapse during a sophisticated attack, the connection between the Backend Server and Database Server operates on a mathematical Least Privilege principle.
- **Root Admin (Banned):** The FastAPI Server is physically banned from connecting as the PostgreSQL Root User.
- **Service Account (`app_user`):** The system connects via an unprivileged `app_user` which has explicitly been granted **only** `SELECT, INSERT, UPDATE, DELETE` across the `secure_app` schema.
- **Fail-Secure Constraint:** A hijacked session cannot execute `DROP DATABASE` or any DDL structural manipulation.

## 3. Web Authorization Configuration (Roles)
Access to URL routes, data, and system functionality are strictly siloed between two user archetypes:

### 3.1 Standard User (`user` role)
- **Permissions:** May only submit context-bound feedback (with encrypted PII via AES-GCM) and explicitly view their own account profile. 
- **Limitations:** Banned from auditing the user table, viewing global analytics, or creating secondary user accounts. All Direct Object References (IDOR checks) force database segregation to exactly their designated SQL rows.

### 3.2 Administrator (`admin` role)
- **Permissions:** Capable of explicitly auditing system user identities and forcefully provisioning new accounts to bypass open registration flaws.
- **Lifecycle Auditing:** The admin is authorized to visually audit the `users` table and forcefully sever access to unused, abandoned, or suspected compromised accounts via the **Account Suspension Engine**. Suspending a user zeroes out their Server-Side `jti` cookie session, instantly disconnecting them from the network threshold. 

## 4. Algorithmic Transaction Limiting (Rate Limiter)
To defend against automated botnet spam and credential stuffing scripts, sliding-window Rate Limiters monitor traffic via exact remote IP metrics:
- **Authentication Routes (`/auth/login`, `/auth/change-password`):** Hard capped at **5 attempts per minute**. Violations trigger a `429 Too Many Requests` physical HTTP drop.
- **Administrative Account Provisioning (`/auth/users`):** Hard capped at **10 provisions per minute** to stop rogue inside administrators from overloading DB storage.
- **Feedback Submissions (`/feedback/submit`):** Capped at **5 submissions per minute** to stall malicious multipart-form file parsing overload.

## 5. Security Validation
1. All session extraction inherently occurs inside backend `deps.py` memory layer utilizing `HttpOnly` Secure cookies (eliminating Client-Side Tampering entirely).
2. Missing or mathematically expired `secrets/access_tokens` default to a universal Deny/Catch-All `401 Unauthorized`.
3. The framework completely ignores 'Referer' headers substituting it natively with cryptographically bounded Database JTI (JWT Session IDs).
