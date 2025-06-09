# Data Encryption & Compliance Notes

This document summarizes how the Client Engagement Hub meets encryption and compliance requirements.

## 1. Encryption at Rest

Supabase automatically encrypts all Postgres data and Storage objects using AES-256.
No additional configuration is required to enable database-level encryption.

## 2. Encryption in Transit

All traffic between clients and Supabase is served over TLS 1.2+. The front-end communicates with the Supabase project URL (e.g., `https://xyz.supabase.co`) through HTTPS.

## 3. Column-Level Encryption (Optional)

If we need to store highly sensitive fields (e.g., personally-identifying information or legal document contents) in plaintext columns, we can enable the `pgcrypto` extension and encrypt/decrypt values using:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- Example: encrypt a note summary
INSERT INTO public.interactions (..., summary)
VALUES (..., pgp_sym_encrypt('raw summary', current_setting('app.encryption_key')));
```

The symmetric key (`app.encryption_key`) is injected via a Supabase secret and rotated on schedule.

## 4. Key Management

- All encryption keys are stored in Supabase **Vault** secrets.
- Keys are rotated at least yearly or upon staff departure.
- Access to secrets is limited to Admin role in Supabase dashboard.

## 5. Compliance Controls

| Requirement             | Control                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| SOC 2 (Security)        | RLS policies plus audit logging of all DML events in `audit_logs` table                                                               |
| SOC 2 (Confidentiality) | AES-256 encryption at rest & TLS in transit                                                                                           |
| GDPR Right to Erasure   | Provide script to purge a client's records across `interactions`, `milestones`, `documents`, `document_versions`, and Storage objects |
| Data Retention          | Default retention 7 years; nightly job flags data past retention for review                                                           |
| Access Control          | Viewer / Editor / Admin roles enforced via RLS                                                                                        |

## 6. Verification Checklist

- [ ] Confirm `pgcrypto` extension enabled in production databases (if column-level encryption required).
- [ ] Verify Supabase Storage bucket `client-documents` is **private**.
- [ ] Run quarterly audit to ensure audit triggers remain active.
- [ ] Review RLS policies every 6 months.
- [ ] Document key rotation in runbooks.
