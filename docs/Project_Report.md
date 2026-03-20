# Secure Software Design and Implementation (CS 4417/6417)
## Final Project Report

### 1. SDLC Integration (Agile/DevSecOps)
The project utilized an **Agile DevSecOps** approach. Security was integrated throughout every step:
- **Sprint Planning Requirement Gathering:** Security constraints were mapped as explicit "Definition of Done" acceptance criteria (e.g., "Login system must reject >5 incorrect attempts", "Feedback form rejects `.exe` files").
- **Implementation & Continuous Integration:** Code was subjected to Static Application Security Testing (SAST). Using the `bandit` CI plugin via pre-commit hooks ensured zero hardcoded credentials and safe cryptographic defaults before any code was pushed to production layers.
- **Verification:** Unit and manual adversarial testing verified input sanitizations continuously across sprint deliveries.

### 2. Attack Surface & Login Attack Tree
**Application Attack Surface:**
1. Authentication Endpoints (`/auth/login`, `/auth/change-password`, `/auth/users`)
2. Input Action Endpoints (`/feedback/`)
3. Static frontend deliveries representing Cross-Site Scripting (XSS) payload delivery channels.

**Login Page Attack Tree (Depth = 3):**
* **Root Strategy:** Compromise User Identity
  * **Level 1:** Credential Attacks
    * **Level 2:** Brute-Force/Dictionary
      * *Level 3 Mitigation:* Rate limiting authentication endpoint and tracking login failures centrally (Audit Logging).
    * **Level 2:** Credential Stuffing (Reusing compromised passwords)
      * *Level 3 Mitigation:* Strict Bcrypt length requirements minimizing automated spraying.
  * **Level 1:** Input Attacks
    * **Level 2:** SQL Injection (SQLi) at the authentication perimeter
      * *Level 3 Mitigation:* Enforced usage of PostgreSQL Parameterized Binding (`sqlalchemy.select` via ORM) removing arbitrary query executions.
  * **Level 1:** Authorization/Session Bypass
    * **Level 2:** Session Hijacking / Fixation
      * *Level 3 Mitigation:* Secure JSON Web Tokens (JWT) encrypted under HMAC SHA-256 expiring implicitly within 30 minutes, stored client-side resiliently against Cross-Site Request Forgery (CSRF).

### 3. Threat Modeling & Security Analysis
| Threat Scenario | Exploitation Vector | CWE Classification | Implemented Mitigation |
| :--- | :--- | :--- | :--- |
| **SQL Injection** | Payload execution via `/login` or `/feedback` message forms. | **CWE-89** (Improper Neutralization of Special Elements) | Used SQLAlchemy Object Relational Mapping (ORM) and fully parameterized queries. |
| **Cross-Site Scripting (XSS)** | Embedding malicious JavaScript inside feedback `message` rendering in Dashboard admin views. | **CWE-79** (Improper Neutralization of Input During Web Page Generation) | Pydantic strict-field validation on models. React UI automatically sanitizes injected HTML DOM elements natively. |
| **Path Traversal & Malicious Execution** | Uploading `.php` / reverse shells into `/feedback` causing RCE on the server. | **CWE-434** (Unrestricted Upload of File with Dangerous Type) | Validated strict MIME Content-Types. Rejected payloads > 2MB. Saved with completely randomized hex identifiers explicitly outside the executable web root. |
| **Inadequate Access Controls** | Standard users maliciously creating arbitrary Administrator accounts. | **CWE-285** (Improper Authorization) | Enforced Role-Based Access Controls (RBAC). The `/users` creation endpoint securely validates the Bearer JWT strictly belongs to an active `admin` identity. |

### 4. Testing & Validation Results
* **Static Analysis (Bandit Benchmark):** Successfully scanned 300+ lines of Python implementation. Found zero medium/high vulnerabilities executing against custom routers and security context environments. `[B105]` false-positives regarding generic "Bearer" constants correctly acknowledged.
* **Format Checking (File Type Validation):** Attempted manual payload submission of `.exe` through `/feedback` resulting strictly in 400 Bad Request triggers without disclosing internal stack trace configurations.
* **Authentication Strength:** Validated the creation of 12-character enforced administrative entities. Verified the bcrypt rotation logic against older dependency vulnerabilities automatically.

### 5. Individual Contributions
All components (Backend execution parsing, Database seeding schema mapping, Frontend React component creation with extensive glassmorphism styling, and comprehensive DevSecOps documentation testing) were executed iteratively and collaboratively under unified agent pairing.
