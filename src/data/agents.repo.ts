// src/data/agents.repo.ts
// ADR-OMK-001 D4 — repository for the `agents` table.

import { makeRepository } from './repository';
import { AGENTS } from '@/lib/constants';
import type { Agent } from '@/lib/types';

export const agentsRepo = makeRepository<Agent>('agents', AGENTS);
