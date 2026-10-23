// @ts-check
/**
 * The agent's side of live training review. Run from the project root:
 *
 *   npm run tuner:listen
 *     Waits until the developer leaves comments in the tuner, prints them
 *     (marking them "working"), and exits. Run it in the background, act
 *     on what it prints, then run it again.
 *
 *   npm run tuner:done -- <id> "<what you changed>"
 *     Marks a comment done; the tuner shows your reply beside it.
 *
 * Any agent that can run a command works, so nothing here is tied to one
 * tool. See the mast-train skill.
 */
import { heartbeat, readFeedback, writeFeedback } from "./feedback.mjs";
import { TRAINING_DIR } from "./integration.mjs";

const [command, ...args] = process.argv.slice(2);

if (command === "listen") await listen(Number(args[0] ?? 1800));
else if (command === "done") done(args[0], args.slice(1).join(" "));
else {
  console.error('Usage: cli.mjs listen [seconds] | done <id> "<reply>"');
  process.exit(1);
}

/** @param {number} seconds Give up after this long (default 30 min). */
async function listen(seconds) {
  const until = Date.now() + seconds * 1000;
  while (Date.now() < until) {
    const feedback = readFeedback();
    const open = feedback.comments.filter(
      (c) => (c.status ?? "open") === "open",
    );
    if (open.length) {
      for (const c of open) c.status = "working";
      writeFeedback(feedback);
      console.log(
        `${open.length} new comment${open.length === 1 ? "" : "s"} from the tuner:\n`,
      );
      for (const c of open) {
        console.log(
          [
            `- id: ${c.id}`,
            `  file: ${TRAINING_DIR}/${c.page}.astro`,
            `  section: ${c.section + 1} (count every <Section>, recipes included)`,
            c.recipe &&
              `  recipe: ${c.recipe}${c.variant ? ` (variant ${c.variant})` : ""}`,
            c.heading && `  heading: "${c.heading}"`,
            `  verdict: ${c.verdict}`,
            `  note: ${c.note || "(none)"}`,
          ]
            .filter(Boolean)
            .join("\n"),
        );
      }
      console.log(
        '\nChange each page now (keep: nothing to change), then run `npm run tuner:done -- <id> "<what you changed>"` for each, and listen again.',
      );
      return;
    }
    heartbeat();
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  console.log(
    "No new comments. Run `npm run tuner:listen` again to keep listening.",
  );
}

/** @param {string | undefined} id @param {string} reply */
function done(id, reply) {
  const feedback = readFeedback();
  const comment = feedback.comments.find((c) => c.id === id);
  if (!comment) {
    console.error(`No comment with id ${id}`);
    process.exit(1);
  }
  comment.status = "done";
  comment.reply = reply.slice(0, 2000) || undefined;
  writeFeedback(feedback);
  console.log(`Marked ${id} done.`);
}
