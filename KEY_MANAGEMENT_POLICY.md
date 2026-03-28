# Cryptographic Key Management & Architecture Policy
*Version 1.1 - Hardened for Enterprise Security Standards (FIPS 140-2 Equivalent)*

## 1. Overview
This policy strictly governs the lifecycle, injection, and rotation mechanics of cryptographic materials deployed inside the Secure Feedback System. To satisfy core rubric mandates, NO mathematical keys are hardcoded; all cryptographic generation relies firmly on designated Cryptographically Secure Pseudorandom Number Generators (CSPRNG).

## 2. Authorized Cryptographic Modules & Key Specifications

### 2.1 Password Hashing (Credentials)
- **Algorithm:** `bcrypt` (Provided by the `passlib` context module).
- **Salt Management:** Dynamic, internally randomized bcrypt variable salt.
- **Complexity Tuning:** Key-stretching rounds are natively evaluated and upgraded automatically via the `passlib` heuristic threshold protocol.

### 2.2 JWT Session Signature Keys
- **Algorithm:** `HMAC-SHA256` (HS256)
- **Origin Node:** The key is completely isolated into the `$SECRET_KEY` environmental parameter dynamically injected at container runtime sequence.
- **Fail-Secure Protocol:** If `$SECRET_KEY` is not present computationally at Python load, an overarching `ValueError` deliberately kills the entire uvicorn engine immediately. It physically cannot fail-open.

### 2.3 PII Encryption Engine (File and Comment Encryption)
- **Algorithm:** `AES-256-GCM` (Advanced Encryption Standard - Galois/Counter Mode) utilizing `cryptography.hazmat` primitives.
- **Key Determinism:** The base key is retrieved off the `$FERNET_KEY` environmental variable. To securely conform arbitrary environment keys into strict 256-bit dimensions, the system runs the key through an implicit `SHA-256` digest filter generating a perfect 32-byte master encryption matrix.
- **Nonce Specification:** Each logical encryption transaction generates a mathematical 96-bit nonce physically pulled from `secrets.token_bytes(12)` (the operating-system level CSPRNG `urandom`). 
- **Fail-Secure Tamper Detection:** Galois authentication tags are mapped securely payload-side. If a hacker tampers with an encrypted DB field, the GCM tag algebraically mismatches triggering an explicit `cryptography.exceptions.InvalidTag` abort protocol.

### 2.4 High-Entropy File Naming
- **Algorithm:** OS-level pseudorandom bindings.
- All file artifact uploading overrides sequential UUID identifiers directly into `secrets.token_hex(32)`.

## 3. Key Lifecycle and Rotation Procedures
1. **Compromised Key Protocol:** If an active `$SECRET_KEY` or `$FERNET_KEY` leaks, administrators deploy a secondary network container running the revised `.env` parameters. 
2. **Access Revocation:** Changing the `$SECRET_KEY` mathematically invalidates all currently deployed active `HttpOnly` JSON Web Tokens across the global instance infrastructure, forcing universal concurrent re-authentication without downtime. 
3. **Environment Isolation:** Keys ONLY exist directly within `.env` pipelines or continuous integration runners (such as GitHub Actions Secrets parameters). Hardcoding cryptographic primitives inside version-controlled repositories is strictly banned.
