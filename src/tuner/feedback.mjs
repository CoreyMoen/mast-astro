// @ts-check
/**
 * Training comments: src/training/feedback.json, shared by the tuner
 * (which adds and deletes them) and the agent (which listens for new
 * ones and marks them done — see ./cli.mjs).
 *
 * Each comment moves open → working (an agent picked it up) → done (the
 * agent changed the page, or answered). `distilled` holds comments that
 * have been folded into the mast-design skill.
 */
import {
  mkdirSync,
  readFileSync,
  statSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { dirname } from "node:path";

export const FEEDBACK_FILE = "src/training/feedback.json";
/** Touched every second or so while `npm run tuner:listen` waits. */
const HEARTBEAT_FILE = ".astro/tuner-listening";

/**
 * @typedef {{ id: string, page: string, section: number, recipe?: string,
 *   variant?: string, heading?: string, verdict: "keep" | "refine" | "avoid",
 *   note: string, created: string, status?: "open" | "working" | "done",
 *   reply?: string }} Comment
 * @typedef {{ comments: Comment[], distilled?: Comment[] }} Feedback
 */

/** @returns {Feedback} */
export function readFeedback() {
  try {
    return JSON.parse(readFileSync(FEEDBACK_FILE, "utf8"));
  } catch {
    return { comments: [] };
  }
}

/** @param {Feedback} feedback */
export function writeFeedback(feedback) {
  mkdirSync(dirname(FEEDBACK_FILE), { recursive: true });
  writeFileSync(FEEDBACK_FILE, JSON.stringify(feedback, null, 2) + "\n");
  return feedback;
}

/** @param {unknown} text @param {number} max */
const clip = (text, max) => String(text ?? "").slice(0, max);

/** @param {any} input */
export function addComment(input) {
  const verdict = ["keep", "refine", "avoid"].includes(input.verdict)
    ? input.verdict
    : "refine";
  const page = clip(input.page, 80);
  if (!/^[\w-]+$/.test(page)) throw new Error("Bad page name");
  const feedback = readFeedback();
  feedback.comments.push({
    id: Date.now().toString(36),
    page,
    section: Number.isInteger(input.section) ? input.section : -1,
    recipe: clip(input.recipe, 40) || undefined,
    variant: clip(input.variant, 40) || undefined,
    heading: clip(input.heading, 160) || undefined,
    verdict,
    note: clip(input.note, 2000),
    created: new Date().toISOString(),
    status: "open",
  });
  return writeFeedback(feedback);
}

/** @param {any} input */
export function deleteComment(input) {
  const feedback = readFeedback();
  feedback.comments = feedback.comments.filter((c) => c.id !== input.id);
  return writeFeedback(feedback);
}

/** Mark that an agent is waiting for comments right now. */
export function heartbeat() {
  mkdirSync(dirname(HEARTBEAT_FILE), { recursive: true });
  const now = new Date();
  try {
    utimesSync(HEARTBEAT_FILE, now, now);
  } catch {
    writeFileSync(HEARTBEAT_FILE, "");
  }
}

/** Whether an agent has been waiting for comments in the last few seconds. */
export function isListening() {
  try {
    return Date.now() - statSync(HEARTBEAT_FILE).mtimeMs < 4000;
  } catch {
    return false;
  }
}
