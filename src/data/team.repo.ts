// src/data/team.repo.ts
// ADR-OMK-001 D4 — repository for the `team` table.

import { makeRepository } from './repository';
import { TEAM } from '@/lib/constants';
import type { TeamMember } from '@/lib/types';

export const teamRepo = makeRepository<TeamMember>('team', TEAM);
