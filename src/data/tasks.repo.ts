// src/data/tasks.repo.ts
// ADR-OMK-001 D4 — repository for the `tasks` table.

import { makeRepository } from './repository';
import { TASKS } from '@/lib/constants';
import type { Task } from '@/lib/types';

export const tasksRepo = makeRepository<Task>('tasks', TASKS);
