import { describe, it, expect } from 'vitest';
import { ProjectService } from './projectService';
import { Project } from '../types/database';

const baseProject: Project = {
  id: 'p1',
  client_id: 'c1',
  name: 'Test Project',
  type: 'tax_prep',
  status: 'pending',
  amount: 1000,
  estimated_hours: 10,
  actual_hours: 0,
  due_date: null,
  notes: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

describe('ProjectService.getDaysUntilDue', () => {
  it('returns null when due_date is null', () => {
    expect(ProjectService.getDaysUntilDue(null)).toBeNull();
  });

  it('calculates positive days until due date', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    expect(ProjectService.getDaysUntilDue(futureDate.toISOString())).toBe(5);
  });

  it('calculates negative days when overdue', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 3);
    expect(ProjectService.getDaysUntilDue(pastDate.toISOString())).toBe(-3);
  });
});

describe('ProjectService.getProjectPriority', () => {
  it('marks overdue projects as high priority', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    const project = {
      ...baseProject,
      due_date: pastDate.toISOString(),
      status: 'in_progress'
    } as Project;
    expect(ProjectService.getProjectPriority(project)).toBe('high');
  });

  it('marks projects due within 7 days as high priority', () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 3);
    const project = { ...baseProject, due_date: soon.toISOString() } as Project;
    expect(ProjectService.getProjectPriority(project)).toBe('high');
  });

  it('marks projects due within 14 days as medium priority', () => {
    const mid = new Date();
    mid.setDate(mid.getDate() + 10);
    const project = { ...baseProject, due_date: mid.toISOString() } as Project;
    expect(ProjectService.getProjectPriority(project)).toBe('medium');
  });

  it('marks projects due later as low priority', () => {
    const late = new Date();
    late.setDate(late.getDate() + 30);
    const project = { ...baseProject, due_date: late.toISOString() } as Project;
    expect(ProjectService.getProjectPriority(project)).toBe('low');
  });
});
