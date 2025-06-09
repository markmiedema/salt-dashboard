## Relevant Files

- `supabase/migrations/20240609_add_client_engagement_tables.sql` - Adds `interactions`, `milestones`, `documents`, and `document_versions` tables plus audit triggers.
- `src/lib/db/types.ts` - TypeScript definitions for new tables.
- `src/services/interactionsService.ts` - CRUD and search logic for interaction records.
- `src/services/milestonesService.ts` - CRUD, status update, and dependency checks for milestones.
- `src/services/documentsService.ts` - Handles document metadata, versioning, and signed upload/download URLs.
- `src/services/teamsIntegrationService.ts` - Sends adaptive-card notifications and links Teams meetings using Graph API.
- `src/pages/ClientEngagementHub.tsx` - Container page that orchestrates the timeline view and child components.
- `src/components/Timeline/TimelineFeed.tsx` - Renders combined feed of interactions, milestones, and document events.
- `src/components/Interactions/InteractionForm.tsx` - Modal/form for logging new interactions with rich-text editor and attachments.
- `src/components/Milestones/MilestoneList.tsx` - Displays milestones with inline status update controls.
- `src/components/Documents/DocumentUpload.tsx` - Drag-and-drop uploader with progress, tag picker, and versioning support.
- `src/components/Documents/DocumentPreview.tsx` - In-app preview for PDFs/Office docs with version history.
- `src/hooks/useTeamsWebhook.ts` - Custom React hook to call Teams integration API and display status.
- `src/services/interactionsService.test.ts` - Unit tests for InteractionsService.
- `src/components/Timeline/TimelineFeed.test.tsx` - Component tests for timeline rendering.
- `tests/e2e/globalSearch.spec.ts` - Playwright E2E test for global search.
- `docs/compliance-and-encryption.md` - Documentation of encryption settings and compliance controls.
- `src/services/engagementSearchService.ts` - Combined search across interactions, milestones, and documents.
- `src/validators/engagementSchemas.ts` - Zod schemas for validating input data.
- `src/components/common/GlobalSearchBar.tsx` - Global search bar that queries backend search service.
- `src/services/teamsIntegrationService.ts` - Sends adaptive-card notifications and links Teams meetings using Graph API.
- `supabase/functions/teamsWebhook/index.ts` - Edge function validating Teams webhook token.
- `supabase/functions/teamsSync/index.ts` - Scheduled edge function to sync Teams meeting transcripts.
- `src/components/Documents/DocumentUpload.test.tsx` - Unit tests for file size validation.
- `src/components/Documents/DocumentPreview.test.tsx` - Unit tests for version list rendering.
- `src/hooks/useTeamsWebhook.ts` - Hook for per-client Teams channel config.
- `src/components/Clients/TeamsChannelSettings.tsx` - UI to edit Teams webhook per client.

### Notes

- Place unit tests alongside or under `tests/` as shown. Run with `npx vitest`.
- Ensure environment variables for Supabase and Microsoft Graph are set in `.env.local`.

## Tasks

- [x] 1.0 Database & Security Foundation

  - [x] 1.1 Design tables (`interactions`, `milestones`, `documents`, `document_versions`) and relationships.
  - [x] 1.2 Write migration script and run against Supabase dev instance (user will execute CLI later).
  - [x] 1.3 Add indexes for common query patterns (client_id, project_id, created_at).
  - [x] 1.4 Configure row-level security policies for Viewer, Editor, Admin roles.
  - [x] 1.5 Create audit triggers for INSERT, UPDATE, DELETE events.
  - [x] 1.6 Set up Supabase Storage bucket and access policies for document files.
  - [x] 1.7 Document encryption settings and verify compliance requirements.

- [x] 2.0 Backend Service Layer & APIs

  - [x] 2.1 Implement `interactionsService` with CRUD and search endpoints.
  - [x] 2.2 Implement `milestonesService` with CRUD, status update, and dependency checks.
  - [x] 2.3 Implement `documentsService` for metadata, versioning, and signed URL generation.
  - [x] 2.4 Implement combined search endpoint across interactions, milestones, documents.
  - [x] 2.5 Add input validation and error handling using Zod schemas.
  - [x] 2.6 Write unit tests for all service modules.

- [x] 3.0 Front-End Timeline & Interaction UI

  - [x] 3.1 Build `TimelineFeed` component with virtualized list for performance.
  - [x] 3.2 Add filter controls (category, date range, keyword search).
  - [x] 3.3 Create `InteractionForm` modal with rich-text editor and attachment support.
  - [x] 3.4 Build `MilestoneList` component with inline status updates.
  - [x] 3.5 Integrate permission guard to hide edit actions for Viewers.
  - [x] 3.6 Implement global search bar that queries backend search endpoint.
  - [x] 3.7 Write component and E2E tests with Playwright.

- [x] 4.0 Front-End Document UI

  - [x] 4.1 Build `DocumentUpload` component with drag-and-drop and progress bar.
  - [x] 4.2 Implement versioning UI in `DocumentPreview` (show revision history).
  - [x] 4.3 Add tagging UI for client, project, milestone linkage.
  - [x] 4.4 Enforce 200 MB file size limit and display helpful errors.
  - [x] 4.5 Add soft-delete and restore functionality.
  - [x] 4.6 Write unit tests for upload utility and preview component.

- [x] 5.0 Teams Integration
  - [x] 5.1 Create webhook endpoint and verify token validation with Teams.
  - [x] 5.2 Implement `teamsIntegrationService` to format adaptive cards for new events.
  - [x] 5.3 Trigger notifications from backend services on create/update events.
  - [x] 5.4 Build linking flow to associate a Teams meeting with a client/project via Graph API.
  - [x] 5.5 Schedule sync job to fetch meeting transcripts and store as interaction records.
  - [x] 5.6 Provide per-client channel configuration UI using `useTeamsWebhook` hook.
  - [x] 5.7 Write integration tests with mocked Teams Graph API.
