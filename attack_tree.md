# Extended Attack Tree: Advanced Auth & Session Threats

This document extends the foundational threat model to include advanced attack vectors targeting session integrity, multi-factor authentication (MFA), and automated brute-force protections.

## 1. Session-Related Attacks
**Goal:** Attacker gains unauthorized access by compromising or manipulating an active, authenticated session.

*   **1.1. Session Hijacking (Token Theft)**
    *   *1.1.1. Cross-Site Scripting (XSS):* Attacker injects malicious JavaScript into the application (e.g., via un-sanitized Feedback comments) to steal JWTs stored in `localStorage` or `sessionStorage`.
        *   **Mitigation:** Store access tokens in `HttpOnly`, `Secure`, `SameSite=Strict` cookies instead of Web Storage, rendering them completely inaccessible to JavaScript. Sanitize all user inputs (already partially implemented via Pydantic regex).
    *   *1.1.2. Man-in-the-Middle (MitM):* Attacker intercepts the token in transit over an unsecured network.
        *   **Mitigation:** Enforce strict HTTPS/TLS 1.2+ for all connections. Use HSTS headers.
*   **1.2. Session Fixation**
    *   *1.2.1. Pre-computed Session Injection:* Attacker sets a known session ID token in the victim's browser before the victim logs in, hijacking the session once authenticated.
        *   **Mitigation:** Tokens must be cryptographically signed (JWT with HS256/RS256) and freshly generated entirely server-side *after* successful authentication. The application must never accept client-proposed session identifiers.

## 2. Multi-Factor Authentication (MFA) Bypass
**Goal:** Attacker circumvents the secondary verification layer after successfully compromising the primary password.

*   **2.1. Logic & State Exploits**
    *   *2.1.1. Direct Object Reference (Incomplete Auth Flow):* Attacker intercepts the initial HTTP 200 OK from the password check and manually navigates to `/dashboard` or hits protected API routes without completing the MFA token step.
        *   **Mitigation:** The primary password check must *not* return a standard JWT. It should return a tightly scoped `mfa_pending_token` that only grants access to the `/verify-mfa` endpoint.
    *   *2.1.2. Race Conditions:* Attacker submits multiple MFA token guesses simultaneously to beat the server's lockout threshold before the state variable updates.
        *   **Mitigation:** Implement strict transactional locking or atomic database operations when recording MFA attempts.
*   **2.2. Social Engineering / SIM Swapping**
    *   *2.2.1. Telecom Override:* Attacker tricks the victim's telecom provider into porting their number to intercept SMS MFA codes.
        *   **Mitigation:** Deprecate SMS-based MFA. Enforce Time-based One-Time Passwords (TOTP) via authenticator apps (e.g., Google Authenticator, Authy) or hardware keys (FIDO2/WebAuthn).

## 3. Brute-Force & Rate-Limiting Evasion
**Goal:** Attacker systematically guesses credentials or MFA tokens without triggering defensive lockouts.

*   **3.1. Rate-Limiting Evasion**
    *   *3.1.1. IP Rotation (Botnets/Proxies):* Attacker distributes requests across thousands of residential proxies to bypass simple IP-based rate limiting (e.g., `5 requests / minute / IP`).
        *   **Mitigation:** Implement global velocity checks based on the *target account* (e.g., lock the `admin@securenet.local` account after 10 failed login attempts, regardless of the incoming IPs).
    *   *3.1.2. Credential Stuffing (Low and Slow):* Attacker uses massive combo lists of leaked passwords and tests them against the login endpoint at a delayed, human-like speed (e.g., 1 request per hour) to evade detection arrays.
        *   **Mitigation:** Implement AI/behavioral anomaly detection, enforce MFA (which neutralizes credential stuffing entirely), and periodically check user password hashes against known-breach databases (e.g., HaveIBeenPwned API).
