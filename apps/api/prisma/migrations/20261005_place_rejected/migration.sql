-- Phase 6 moderation workflow: retain rejected submissions without deleting them.
ALTER TYPE "PlaceStatus" ADD VALUE IF NOT EXISTS 'REJECTED';
