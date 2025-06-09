# Client Engagement Hub PRD

## 1. Introduction / Overview

The **Client Engagement Hub** is a unified workspace inside the SALT dashboard where internal staff can:

1. Log every interaction with a client (calls, emails, meetings, ad-hoc notes).
2. Track project milestones and overall progress on SALT engagements.
3. Store and manage all documents related to the client and project lifecycle (onboarding forms, compliance filings, research reports, checklists, deliverables, legal filings, supporting data, etc.).

By consolidating these capabilities into a single timeline-style view, the hub improves accountability, audit readiness, and day-to-day collaboration. Microsoft Teams integration will surface notifications and capture meeting details automatically.

## 2. Goals

- Provide a **chronological timeline view** combining interactions, milestones, and file activity for each client and project.
- Eliminate siloed spreadsheets and disparate file shares by offering **one source of truth** for engagement history and documents.
- Enable **staff-only access** with granular permissions (view, edit, admin) per client/project.
- Integrate with **Microsoft Teams** for real-time notifications and optional meeting auto-logging.
- Reduce audit preparation time by **≥ 30 %** through centralized, searchable records.

## 3. User Stories

1. **As an account manager**, I want to log details of a client call (participants, summary, follow-ups) so the entire team can stay informed.
2. **As a project lead**, I want to record milestone completions with status notes so leadership can track progress at a glance.
3. **As a team member**, I want to upload compliance filings and tag them to the appropriate milestone so auditors can easily find supporting evidence.
4. **As a compliance analyst**, I want to search a client's engagement hub for "research report" to quickly locate specific documents.
5. **As a stakeholder**, I want to receive a Teams notification when a new deliverable is uploaded so I can review it promptly.

## 4. Functional Requirements

1. **Timeline View**
   1.1 The system shall display interactions, milestone events, and file uploads in a single chronological feed.
   1.2 Items shall be filterable by category (interaction, milestone, document) and date range.

2. **Interaction Logging**
   2.1 Staff shall be able to create interaction entries with fields: date/time, type (call, email, meeting, note), participants, summary, follow-up tasks, and attachments.
   2.2 The system shall support linking an interaction to one or more projects under the same client.

3. **Milestone Tracking**
   3.1 Staff shall define a set of milestones per project with name, description, target date, status (Not Started / In Progress / Complete), and responsible owner.
   3.2 Milestone updates shall appear in the timeline feed.

4. **Document Management**
   4.1 Staff shall upload files up to 200 MB each; supported formats: PDF, DOCX, XLSX, PPTX, CSV, and common image formats.
   4.2 The system shall allow versioning: uploading a new version retains history and increments revision number.
   4.3 Files shall be tagged to a client and optionally to a specific project and milestone.
   4.4 The system shall provide in-app preview for PDFs and Office docs (using existing preview service).

5. **Search & Filter**
   5.1 Users shall search across interactions, milestones, and documents by keyword, date range, or tag.
   5.2 Results shall respect the user's permission scope.

6. **Permissions & Security**
   6.1 Three roles: Viewer (read-only), Editor (create/update/delete own items), Admin (full control including role assignment).
   6.2 Role assignment is scoped per client and inherited by that client's projects.
   6.3 All data changes shall be audited (who, what, when).

7. **Microsoft Teams Integration**
   7.1 The system shall send adaptive-card notifications to a designated Teams channel on new interactions, milestone updates, and document uploads.
   7.2 Staff may link a Teams meeting to a client/project; meeting recordings and transcripts can be attached automatically (via Teams Graph API).

8. **Performance & Scalability**
   8.1 Timeline view shall load the most recent 50 items in ≤ 2 s on a typical broadband connection.
   8.2 The system shall support at least 10,000 documents and 50,000 timeline items per client without perceptible slow-down.

## 5. Non-Goals (Out of Scope)

- External (client) portal for direct client access.
- Automated email parsing beyond Teams integration for the first release.
- Offline desktop or mobile native apps (responsive web only for v1).

## 6. Design Considerations

- Leverage existing SALT dashboard UI components (Tailwind styling) to ensure consistent look and feel.
- Timeline items should use clear icons and color-coded labels (interaction, milestone, document).
- Keep upload interface drag-and-drop with progress indicator.

## 7. Technical Considerations

- Use existing Supabase backend; extend schema with tables: `interactions`, `milestones`, `documents`, `document_versions`.
- Leverage Supabase Storage for file uploads with signed URLs.
- Use Microsoft Graph API for Teams webhook notifications and meeting data.
- Ensure PII encryption at rest and in transit.

## 8. Success Metrics

- ≥ 80 % of client communications logged within 24 h by end of first quarter.
- ≥ 90 % positive staff survey response on "information easily found" within six months.
- Audit prep time reduced by at least 30 % compared to prior cycle.

## 9. Open Questions

1. Maximum total storage per client—should quotas be enforced?
2. Retention policy for documents and interaction logs (e.g., GDPR / SOC 2 compliance)?
3. Exact Teams channels configuration—single global vs. per-client channel?
4. Desired notification granularity—should users customize which events trigger alerts?
5. Do milestones require dependency handling (e.g., can't mark Milestone B complete until Milestone A)?
