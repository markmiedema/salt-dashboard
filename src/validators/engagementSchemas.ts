import { z } from 'zod';

/* -------------------------------------------------------------------------- */
/*                               Interaction                                  */
/* -------------------------------------------------------------------------- */

export const interactionCreateSchema = z.object({
  client_id: z.string().uuid(),
  project_id: z.string().uuid().nullable().optional(),
  type: z.enum(['call', 'email', 'meeting', 'note']),
  occurred_at: z.string().datetime({ offset: true }),
  participants: z.array(z.string()).nullable().optional(),
  summary: z.string().min(1),
  follow_up: z.string().nullable().optional(),
  created_by: z.string().uuid().nullable().optional()
});

export const interactionUpdateSchema = interactionCreateSchema.partial();

/* -------------------------------------------------------------------------- */
/*                                Milestone                                   */
/* -------------------------------------------------------------------------- */

export const milestoneCreateSchema = z.object({
  client_id: z.string().uuid(),
  project_id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  target_date: z.string().date().nullable().optional(),
  status: z.enum(['not_started', 'in_progress', 'complete']).optional(),
  owner_id: z.string().uuid().nullable().optional(),
  depends_on: z.array(z.string().uuid()).nullable().optional()
});

export const milestoneUpdateSchema = milestoneCreateSchema.partial();

/* -------------------------------------------------------------------------- */
/*                                 Document                                   */
/* -------------------------------------------------------------------------- */

export const documentCreateSchema = z.object({
  client_id: z.string().uuid(),
  project_id: z.string().uuid().nullable().optional(),
  milestone_id: z.string().uuid().nullable().optional(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  created_by: z.string().uuid().nullable().optional()
});

export const documentUpdateSchema = documentCreateSchema.partial();
