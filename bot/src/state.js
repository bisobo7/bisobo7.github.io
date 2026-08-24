// bot/src/state.js — per-owner draft state, held in memory only.
//
// Nothing reaches the repo until /add, so an abandoned draft costs nothing and
// a restart simply loses it. Photos are kept as Telegram file_ids and are not
// downloaded until the owner confirms.
import { config } from './config.js';

const drafts = new Map();      // userId -> draft
const listings = new Map();    // userId -> the numbered list last shown

export const STEPS = { PHOTOS: 'photos', DESCRIPTION: 'description', PREVIEW: 'preview' };

export function startDraft(userId, fields) {
  const draft = {
    step: STEPS.PHOTOS,
    fields,
    photos: [],          // [{ fileId, uniqueId }]
    photoNames: [],
    description: '',
    createdAt: Date.now(),
    pendingNotice: null, // debounce timer for album uploads
  };
  drafts.set(userId, draft);
  return draft;
}

export function getDraft(userId) {
  const draft = drafts.get(userId);
  if (!draft) return null;
  if (Date.now() - draft.createdAt > config.draftTtlMs) {
    drafts.delete(userId);
    return null;
  }
  return draft;
}

export const clearDraft = (userId) => drafts.delete(userId);

/** Remember the list last shown so /sold 3 resolves against what the owner saw. */
export const rememberListing = (userId, rows) => listings.set(userId, rows);
export const recallListing = (userId) => listings.get(userId) || [];
