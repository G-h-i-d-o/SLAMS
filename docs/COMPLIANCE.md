# Compliance — POPIA & GDPR

## Data inventory

| Data category | Table | Fields | Purpose | Retention |
|---|---|---|---|---|
| User identity | `profiles` | email, full_name, role, is_active | Login + authorization | Until account deletion |
| Auth credentials | `auth.users` | email, hashed password | Authentication | Until account deletion |
| Company data | `companies` | name, customer_number | Client reference | Until contract end + 5 years |
| SLA contracts | `metrics` | All fields | Service level tracking | Until contract end + 5 years |
| Revisions | `metric_revisions` | action, dates, changes | Audit trail | 5 years |
| Evaluations | `metric_evaluations` | actuals, breach flags | Performance tracking | 3 years |
| Audit log | `audit_log` | actor, table, action, data | Security + compliance | 3 years |
| Notifications | `notifications` | title, body | User alerts | 90 days |
| Import jobs | `import_jobs` | file, status, errors | Data provenance | 1 year |

## Roles and lawful basis

| Role | Lawful basis |
|---|---|
| **Controller** | The client (company whose data is being tracked) |
| **Processor** | Us (SLA Management Systems) |
| **Data subject** | End users of the client, plus client staff whose emails are in `contact_company` |

## Retention policy

- **Personal data** (email, name): deleted when the account is deleted
- **Audit log entries** referencing a deleted user: retained with `user_id` set to null
- **Metrics, evaluations**: retained for the contract's legal retention period
- **Notifications**: purged after 90 days

## Data subject rights

| Right | Implementation |
|---|---|
| Access | Admin can export a user's data via SQL query; end-user can request |
| Rectification | Edit profile fields via app; contact support for email change |
| Erasure | Admin deletes user via the Users page → atomically removes auth + profile |
| Portability | Master export produces all metrics; user data exported on request |
| Object | Contact support |

## International transfers

Data is hosted on Supabase (AWS). Choose a region closest to your primary user base. Current region is set in Supabase → Project Settings → General.

## Security measures

- **Encryption in transit**: HTTPS everywhere, HSTS enforced
- **Encryption at rest**: Supabase-managed (AES-256)
- **Access control**: Row Level Security on every table; three-tier RBAC
- **Audit**: every write logged with actor, timestamp, before/after values
- **Backups**: nightly `pg_dump` to S3, 30-day retention
- **Monitoring**: Sentry + UptimeRobot

## Data Processing Agreement (DPA)

A DPA template is available on request. The essential terms:

1. We process data only on documented instructions from the client
2. We maintain confidentiality of processing personnel
3. We implement appropriate technical and organizational measures
4. We assist the client with data subject requests
5. We delete or return data at the end of the engagement
6. We make available all information necessary to demonstrate compliance

## Breach notification

Any personal data breach will be reported to the affected client within **72 hours** of discovery, with:

- Description of the breach
- Categories and approximate number of data subjects affected
- Likely consequences
- Measures taken or proposed to address the breach