/**
 * Tuner behavior: phases, controls, live frame updates, pan/zoom,
 * training comments, and saving through the dev endpoints in
 * ./integration.mjs.
 *
 *  - Token controls (Details) and token dials (Expression) set custom
 *    properties on every frame's <html>, and the tuner's own, so the
 *    panel follows along. No reload.
 *  - Choice dials post their positions to /__mast/dials/preview and
 *    reload the frames, which re-render through getChoices().
 *  - Save writes changed tokens to tokens.css, then changed dials to
 *    dials.ts (which reloads the page; the view survives in
 *    sessionStorage).
 */
import type { Dial } from "@/dials.ts";

type Value = string | number;
type Phase = "details" | "expression" | "training";
type Verdict = "keep" | "refine" | "avoid";

interface Comment {
  id: string;
  page: string;
  section: number;
  recipe?: string;
  variant?: string;
  heading?: string;
  verdict: Verdict;
  note: string;
}

type Target = Omit<Comment, "id" | "verdict" | "note">;

interface Data {
  dials: Record<string, Dial>;
  presets: Record<
    string,
    { description: string; values: Record<string, Value> }
  >;
  choices: Record<string, Value>;
  tokens: Record<string, string>;
  feedback: { comments: Comment[] };
  nextBatch: string;
}

const dataEl = document.getElementById("tuner-data");
if (dataEl) init(JSON.parse(dataEl.textContent ?? "{}") as Data);

function init({ dials, presets, choices, tokens, feedback, nextBatch }: Data) {
  const root = document.documentElement;
  const canvas = document.querySelector<HTMLElement>("[data-tuner-canvas]")!;
  const worlds = [
    ...document.querySelectorAll<HTMLElement>("[data-phase-world]"),
  ];
  const frames = [
    ...document.querySelectorAll<HTMLIFrameElement>("[data-tuner-frame]"),
  ];
  const statusEl = document.querySelector<HTMLElement>("[data-status]")!;
  const saveBtn = document.querySelector<HTMLButtonElement>(
    '[data-action="save"]',
  )!;
  const resetBtn = document.querySelector<HTMLButtonElement>(
    '[data-action="reset"]',
  )!;

  // Saved values come from the files; choice ones may carry an unsaved
  // preview left from before a reload, so read both.
  const saved: Record<string, Value> = {};
  for (const [name, d] of Object.entries(dials)) saved[name] = d.value;
  const state: Record<string, Value> = { ...saved, ...choices };
  const savedTokens: Record<string, string> = { ...tokens };
  const tokenState: Record<string, string> = { ...tokens };
  let scheme = "light dark";
  let phase: Phase = "details";

  const isToken = (name: string) => dials[name]?.kind === "token";
  const cssVar = (name: string) =>
    `--dial-${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;

  // ---- Applying values -------------------------------------------------

  function apply(doc: Document) {
    const style = doc.documentElement.style;
    for (const name of Object.keys(dials))
      if (isToken(name)) style.setProperty(cssVar(name), String(state[name]));
    for (const token of Object.keys(tokenState)) {
      if (tokenState[token] === savedTokens[token]) style.removeProperty(token);
      else style.setProperty(token, tokenState[token]);
    }
  }

  function applyScheme(doc: Document) {
    doc.documentElement.style.colorScheme = scheme;
  }

  function frameDocs(): Document[] {
    return frames
      .map((f) => f.contentDocument)
      .filter((d): d is Document => !!d?.documentElement);
  }

  function applyAll() {
    for (const doc of [document, ...frameDocs()]) apply(doc);
    frames.forEach(measure);
  }

  function setValue(name: string, value: Value) {
    state[name] = value;
    syncControls();
    if (isToken(name)) {
      applyAll();
      // Linked radius readouts follow Softness.
      if (name === "softness") syncTokenControls();
    } else queueChoicePreview();
    updateStatus();
  }

  function setTokens(list: string[], value: string) {
    for (const token of list) tokenState[token] = value;
    applyAll();
    updateStatus();
  }

  let previewTimer = 0;
  function queueChoicePreview() {
    clearTimeout(previewTimer);
    previewTimer = window.setTimeout(async () => {
      const values: Record<string, Value> = {};
      for (const name of Object.keys(dials))
        if (!isToken(name)) values[name] = state[name];
      await post("/__mast/dials/preview", values);
      frames.forEach((f) => {
        if (f.getAttribute("src")) f.contentWindow?.location.reload();
      });
    }, 120);
  }

  // ---- Dial controls ---------------------------------------------------

  const ranges = [
    ...document.querySelectorAll<HTMLInputElement>("input[data-dial]"),
  ];
  const stops = [
    ...document.querySelectorAll<HTMLButtonElement>("[data-stop]"),
  ];

  for (const input of ranges) {
    input.addEventListener("input", () =>
      setValue(input.dataset.dial!, Number(input.value)),
    );
  }
  for (const button of stops) {
    button.addEventListener("click", () => {
      const d = dials[button.dataset.dial!];
      const stop =
        d.kind === "choice"
          ? d.stops.find((s) => String(s) === button.dataset.stop)
          : undefined;
      if (stop !== undefined) setValue(button.dataset.dial!, stop);
    });
  }

  function syncControls() {
    for (const input of ranges) {
      const value = state[input.dataset.dial!];
      input.value = String(value);
      const readout = document.querySelector(
        `[data-readout="${input.dataset.dial}"]`,
      );
      if (readout) {
        const d = dials[input.dataset.dial!];
        const whole = d.kind === "token" && Number.isInteger(d.step);
        readout.textContent = Number(value).toFixed(whole ? 0 : 2);
      }
    }
    for (const button of stops) {
      button.setAttribute(
        "aria-checked",
        String(String(state[button.dataset.dial!]) === button.dataset.stop),
      );
    }
    for (const el of document.querySelectorAll<HTMLElement>(
      "[data-rationale]",
    )) {
      const d = dials[el.dataset.rationale!];
      if (d.kind === "choice")
        el.textContent =
          d.rationale[String(state[el.dataset.rationale!])] ?? "";
    }
  }

  const presetSelect =
    document.querySelector<HTMLSelectElement>("[data-preset]")!;
  presetSelect.addEventListener("change", () => {
    const preset = presets[presetSelect.value];
    presetSelect.value = "";
    if (!preset) return;
    let choiceChanged = false;
    for (const [name, value] of Object.entries(preset.values)) {
      if (!(name in dials)) continue;
      if (!isToken(name) && state[name] !== value) choiceChanged = true;
      state[name] = value;
    }
    syncControls();
    syncTokenControls();
    applyAll();
    if (choiceChanged) queueChoicePreview();
    updateStatus();
  });

  // ---- Token controls (Details) ----------------------------------------

  const tokenControls = [
    ...document.querySelectorAll<HTMLElement>("[data-control]"),
  ];
  const listOf = (el: HTMLElement) => el.dataset.tokens!.split(",");

  /** Any CSS color as #rrggbb, for <input type="color">. */
  const probe = document.createElement("canvas").getContext("2d")!;
  function toHex(color: string): string {
    probe.fillStyle = "#000";
    probe.fillStyle = color;
    return probe.fillStyle;
  }

  const LIGHT_DARK =
    /^light-dark\(\s*(var\(--[\w-]+\))\s*,\s*(var\(--[\w-]+\))\s*\)$/;

  /** Turn a control's inputs into the token's CSS value. */
  function readControl(el: HTMLElement): string {
    const type = el.dataset.control;
    if (type === "color" || type === "select")
      return (el as HTMLInputElement).value;
    if (type === "pair") {
      const [light, dark] = el.querySelectorAll("select");
      return `light-dark(${light.value}, ${dark.value})`;
    }
    const range = el.querySelector<HTMLInputElement>('input[type="range"]')!;
    const linked = el.querySelector<HTMLInputElement>("[data-linked]");
    if (linked?.checked)
      return `calc(${el.dataset.full} * var(--dial-softness))`;
    return `${Number(range.value)}${el.dataset.unit ?? ""}`;
  }

  /** Set a control's inputs from a token value. */
  function writeControl(el: HTMLElement, value: string) {
    const type = el.dataset.control;
    if (type === "color") {
      (el as HTMLInputElement).value = toHex(value);
      return;
    }
    if (type === "select") {
      const select = el as HTMLSelectElement;
      if (![...select.options].some((o) => o.value === value))
        select.add(new Option(`Custom: ${value}`, value));
      select.value = value;
      return;
    }
    if (type === "pair") {
      const match = LIGHT_DARK.exec(value);
      const selects = el.querySelectorAll("select");
      if (match) {
        selects[0].value = match[1];
        selects[1].value = match[2];
      }
      // A value that isn't a plain pair is left for the CSS.
      selects.forEach((s) => (s.disabled = !match));
      return;
    }
    const range = el.querySelector<HTMLInputElement>('input[type="range"]')!;
    const linked = el.querySelector<HTMLInputElement>("[data-linked]");
    const output = el.querySelector("output")!;
    if (linked) {
      linked.checked = value.includes("--dial-softness");
      range.disabled = linked.checked;
      const rem = linked.checked
        ? parseFloat(el.dataset.full!) * Number(state.softness)
        : value.endsWith("px")
          ? parseFloat(value) / 16
          : parseFloat(value);
      range.value = String(rem);
      output.textContent = `${Number(rem.toFixed(2))}rem`;
      return;
    }
    range.value = String(parseFloat(value));
    output.textContent = value;
  }

  function syncTokenControls() {
    for (const el of tokenControls)
      writeControl(el, tokenState[listOf(el)[0]] ?? "");
  }

  for (const el of tokenControls) {
    const handler = () => {
      setTokens(listOf(el), readControl(el));
      writeControl(el, tokenState[listOf(el)[0]]);
    };
    el.addEventListener("input", handler);
    el.addEventListener("change", handler);
  }

  // ---- Preview options -------------------------------------------------

  for (const button of document.querySelectorAll<HTMLButtonElement>(
    "[data-scheme]",
  )) {
    button.addEventListener("click", () => {
      scheme = button.dataset.scheme!;
      for (const b of document.querySelectorAll("[data-scheme]"))
        b.setAttribute("aria-checked", String(b === button));
      frameDocs().forEach(applyScheme);
    });
  }

  const mobileToggle =
    document.querySelector<HTMLInputElement>("[data-mobile]")!;
  mobileToggle.addEventListener("change", () => {
    root.classList.toggle("is-desktop-only", !mobileToggle.checked);
    saveView();
  });

  // ---- Status, save, reset, copy ---------------------------------------

  const changedDials = () =>
    Object.keys(dials).filter(
      (name) => String(state[name]) !== String(saved[name]),
    );
  const changedTokens = () =>
    Object.keys(tokenState).filter((t) => tokenState[t] !== savedTokens[t]);

  function updateStatus(message?: string) {
    const names = [
      ...changedTokens(),
      ...changedDials().map((n) => dials[n].label),
    ];
    saveBtn.disabled = resetBtn.disabled = names.length === 0;
    statusEl.textContent =
      message ??
      (names.length
        ? `Unsaved: ${names.join(", ")}`
        : "Saved to tokens.css and dials.ts");
  }

  saveBtn.addEventListener("click", async () => {
    const tokenValues = Object.fromEntries(
      changedTokens().map((t) => [t, tokenState[t]]),
    );
    const dialValues = Object.fromEntries(
      changedDials().map((n) => [n, state[n]]),
    );
    if (Object.keys(tokenValues).length) {
      if (!(await post("/__mast/tokens/save", tokenValues)))
        return updateStatus("Couldn't save tokens. Check the dev server log.");
      Object.assign(savedTokens, tokenValues);
    }
    if (Object.keys(dialValues).length) {
      if (!(await post("/__mast/dials/save", dialValues)))
        return updateStatus("Couldn't save dials. Check the dev server log.");
      Object.assign(saved, dialValues);
    }
    applyAll();
    updateStatus();
  });

  resetBtn.addEventListener("click", () => {
    const choiceChanged = changedDials().some((n) => !isToken(n));
    Object.assign(state, saved);
    Object.assign(tokenState, savedTokens);
    syncControls();
    syncTokenControls();
    applyAll();
    if (choiceChanged) queueChoicePreview();
    updateStatus();
  });

  document
    .querySelector('[data-action="copy"]')!
    .addEventListener("click", async () => {
      const lines = Object.entries(dials).map(([name, d]) => {
        const value = state[name];
        const meaning =
          d.kind === "token"
            ? `${d.min} = ${d.ends[0]} … ${d.max} = ${d.ends[1]}`
            : (d.rationale[String(value)] ?? "");
        return `- ${d.label} (${name}): ${value} — ${meaning}`;
      });
      const tokenLines = changedTokens().map(
        (t) => `- ${t}: ${tokenState[t]} (was ${savedTokens[t]})`,
      );
      const text = [
        `Mast dial positions (src/dials.ts):\n${lines.join("\n")}`,
        tokenLines.length &&
          `Unsaved token changes (src/styles/tokens.css):\n${tokenLines.join("\n")}`,
      ]
        .filter(Boolean)
        .join("\n\n");
      await copy(text, "Copied the current settings");
    });

  async function copy(text: string, done: string) {
    try {
      await navigator.clipboard.writeText(text);
      updateStatus(done);
    } catch {
      updateStatus("Clipboard unavailable");
    }
  }

  /** POST JSON to a tuner endpoint; the parsed reply, or null on failure. */
  async function post(url: string, values: object): Promise<any> {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  }

  // ---- Training --------------------------------------------------------

  const commentToggle = document.querySelector<HTMLInputElement>(
    "[data-comment-mode]",
  );
  const form = document.querySelector<HTMLFormElement>("[data-comment-form]");
  const noteEl = document.querySelector<HTMLTextAreaElement>(
    "[data-comment-note]",
  );
  const targetEl = document.querySelector<HTMLElement>("[data-comment-target]");
  const listEl = document.querySelector<HTMLElement>("[data-comments]");
  let comments = feedback.comments;
  let verdict: Verdict = "refine";
  let target: Target | null = null;

  const isTraining = (frame: HTMLIFrameElement) =>
    frame.dataset.src?.startsWith("/training/") ?? false;
  const sectionsOf = (doc: Document) => [
    ...doc.querySelectorAll<HTMLElement>(".section"),
  ];
  const describe = (c: Target) =>
    [
      c.page,
      `section ${c.section + 1}`,
      c.recipe && `${c.recipe}${c.variant ? ` (${c.variant})` : ""}`,
    ]
      .filter(Boolean)
      .join(" · ");

  const COMMENT_CSS = `
    .tuner-c-hover { outline: 4px solid #d14424; outline-offset: -4px; cursor: crosshair; }
    [data-tuner-pinned] { position: relative; }
    .tuner-c-pins { position: absolute; top: 12px; left: 12px; z-index: 50; display: flex; gap: 6px; pointer-events: none; }
    .tuner-c-pin { padding: 4px 12px; border-radius: 99px; font: 600 18px/1.4 system-ui, sans-serif; text-transform: uppercase; letter-spacing: .04em; color: #fff; background: #6b6a63; box-shadow: 0 2px 8px rgb(0 0 0 / .2); }
    .tuner-c-pin.cc-keep { background: #2e7d43; }
    .tuner-c-pin.cc-avoid { background: #b3261e; }
  `;

  function renderPins(frame: HTMLIFrameElement) {
    const doc = frame.contentDocument;
    if (!doc?.body || !isTraining(frame)) return;
    doc.querySelectorAll(".tuner-c-pins").forEach((p) => p.remove());
    doc
      .querySelectorAll("[data-tuner-pinned]")
      .forEach((s) => s.removeAttribute("data-tuner-pinned"));
    const sections = sectionsOf(doc);
    for (const c of comments.filter((c) => c.page === frame.dataset.page)) {
      const section = sections[c.section];
      if (!section) continue;
      section.dataset.tunerPinned = "";
      let pins = section.querySelector<HTMLElement>(":scope > .tuner-c-pins");
      if (!pins) {
        pins = doc.createElement("div");
        pins.className = "tuner-c-pins";
        section.prepend(pins);
      }
      const pin = doc.createElement("span");
      pin.className = `tuner-c-pin cc-${c.verdict}`;
      pin.textContent = c.verdict;
      pins.append(pin);
    }
  }

  function renderComments() {
    if (!listEl) return;
    listEl.replaceChildren();
    if (!comments.length) {
      const empty = document.createElement("li");
      empty.className = "tuner_empty";
      empty.textContent = "No comments yet.";
      listEl.append(empty);
    }
    for (const c of [...comments].reverse()) {
      const li = document.createElement("li");
      li.className = "tuner_comment";
      const body = document.createElement("div");
      body.className = "tuner_comment-body";
      const badge = document.createElement("span");
      badge.className = `tuner_verdict cc-${c.verdict}`;
      badge.textContent = c.verdict;
      const meta = document.createElement("span");
      meta.className = "tuner_comment-meta";
      meta.textContent = describe(c);
      const note = document.createElement("div");
      note.textContent = c.note || c.heading || "";
      body.append(badge, meta, note);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "tuner_icon-btn";
      remove.setAttribute("aria-label", "Delete comment");
      remove.textContent = "×";
      remove.addEventListener("click", async () => {
        const result = await post("/__mast/training/delete", { id: c.id });
        if (result) setComments(result.comments);
      });
      li.append(body, remove);
      listEl.append(li);
    }
  }

  function setComments(next: Comment[]) {
    comments = next;
    renderComments();
    frames.forEach(renderPins);
  }

  function openForm(next: Target) {
    if (!form || !targetEl || !noteEl) return;
    target = next;
    targetEl.textContent = describe(next);
    form.hidden = false;
    noteEl.value = "";
    noteEl.focus();
  }

  function closeForm() {
    target = null;
    if (form) form.hidden = true;
  }

  for (const button of document.querySelectorAll<HTMLButtonElement>(
    "[data-verdict]",
  )) {
    button.addEventListener("click", () => {
      verdict = button.dataset.verdict as Verdict;
      for (const b of document.querySelectorAll("[data-verdict]"))
        b.setAttribute("aria-checked", String(b === button));
    });
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!target || !noteEl) return;
    const result = await post("/__mast/training/comment", {
      ...target,
      verdict,
      note: noteEl.value.trim(),
    });
    if (!result) return updateStatus("Couldn't save the comment.");
    setComments(result.comments);
    closeForm();
    updateStatus("Comment saved to src/training/feedback.json");
  });
  document
    .querySelector("[data-comment-cancel]")
    ?.addEventListener("click", closeForm);

  commentToggle?.addEventListener("change", () => {
    root.classList.toggle("is-commenting", commentToggle.checked);
    if (!commentToggle.checked) closeForm();
  });

  function wireComments(frame: HTMLIFrameElement, doc: Document) {
    if (!isTraining(frame)) return;
    const style = doc.createElement("style");
    style.textContent = COMMENT_CSS;
    doc.head.append(style);
    let hovered: HTMLElement | null = null;
    doc.addEventListener("mouseover", (event) => {
      const section = commentToggle?.checked
        ? (event.target as Element).closest<HTMLElement>(".section")
        : null;
      if (section === hovered) return;
      hovered?.classList.remove("tuner-c-hover");
      hovered = section;
      hovered?.classList.add("tuner-c-hover");
    });
    doc.addEventListener(
      "click",
      (event) => {
        if (!commentToggle?.checked) return;
        const section = (event.target as Element).closest<HTMLElement>(
          ".section",
        );
        if (!section) return;
        event.preventDefault();
        event.stopPropagation();
        openForm({
          page: frame.dataset.page!,
          section: sectionsOf(doc).indexOf(section),
          recipe: section.dataset.recipe,
          variant: section.dataset.variant,
          heading:
            section.querySelector("h1, h2, h3")?.textContent?.trim() ??
            undefined,
        });
      },
      true,
    );
    renderPins(frame);
  }

  const PROMPTS = {
    generate: () =>
      `Use the mast-train skill to generate training batch ${nextBatch}: new pages in src/training/pages/ named batch-${nextBatch}-<topic>.astro, built only from the recipes in src/components/recipes/ and the layout primitives. First read .agents/skills/mast-design/SKILL.md and src/training/feedback.json, so the batch explores what's still open and avoids what's marked avoid.`,
    distill: () =>
      `Use the mast-train skill to distill src/training/feedback.json (${comments.length} comment${comments.length === 1 ? "" : "s"}) into .agents/skills/mast-design/SKILL.md. Generalize each comment into a rule with its reason, merge it with what's already there, and show me the diff.`,
  };
  for (const button of document.querySelectorAll<HTMLButtonElement>(
    "[data-copy-prompt]",
  )) {
    button.addEventListener("click", () =>
      copy(
        PROMPTS[button.dataset.copyPrompt as keyof typeof PROMPTS](),
        "Copied the prompt. Paste it to your agent.",
      ),
    );
  }

  // ---- Frames ----------------------------------------------------------

  // Pages size themselves to the viewport in places (min-height: 100vh);
  // inside a frame sized to its content, that would only ever grow.
  const FRAME_CSS =
    ".page-wrapper{min-height:0!important}astro-dev-toolbar{display:none!important}";

  function measure(frame: HTMLIFrameElement) {
    const doc = frame.contentDocument;
    if (!doc?.body) return;
    requestAnimationFrame(() => {
      frame.style.height = `${doc.documentElement.scrollHeight}px`;
    });
  }

  for (const frame of frames) {
    frame.addEventListener("load", () => {
      const doc = frame.contentDocument;
      if (!doc?.head) return;
      const style = doc.createElement("style");
      style.textContent = FRAME_CSS;
      doc.head.append(style);
      apply(doc);
      applyScheme(doc);
      measure(frame);
      new ResizeObserver(() => measure(frame)).observe(doc.body);
      wireComments(frame, doc);
      // Wheel events inside a frame never reach this document; forward
      // them so the canvas pans and zooms from anywhere.
      doc.addEventListener(
        "wheel",
        (event) => {
          const rect = frame.getBoundingClientRect();
          const scale = views[phase].scale;
          onWheel(
            event,
            rect.left + event.clientX * scale,
            rect.top + event.clientY * scale,
          );
        },
        { passive: false },
      );
      doc.addEventListener("keydown", onKey);
      doc.addEventListener("keyup", onKey);
    });
  }

  // ---- Phases ----------------------------------------------------------

  const tabs = [
    ...document.querySelectorAll<HTMLButtonElement>("[data-phase-tab]"),
  ];
  for (const tab of tabs)
    tab.addEventListener("click", () =>
      showPhase(tab.dataset.phaseTab as Phase),
    );

  const world = () =>
    worlds.find((w) => w.dataset.phaseWorld === phase) ?? worlds[0];

  function showPhase(next: Phase) {
    phase = next;
    for (const tab of tabs)
      tab.setAttribute("aria-selected", String(tab.dataset.phaseTab === next));
    for (const panel of document.querySelectorAll<HTMLElement>(
      "[data-phase-panel]",
    ))
      panel.hidden = panel.dataset.phasePanel !== next;
    for (const w of worlds) w.hidden = w.dataset.phaseWorld !== next;
    presetSelect.hidden = next !== "expression";
    // Frames load the first time their phase is shown.
    for (const frame of world().querySelectorAll<HTMLIFrameElement>(
      "[data-tuner-frame]",
    ))
      if (!frame.getAttribute("src")) frame.src = frame.dataset.src!;
    if (views[next].fitted) render();
    else fit();
  }

  // ---- Pan and zoom ----------------------------------------------------

  const fresh = () => ({ x: 0, y: 0, scale: 0.2, fitted: false });
  const views: Record<Phase, ReturnType<typeof fresh>> = {
    details: fresh(),
    expression: fresh(),
    training: fresh(),
  };
  const zoomLabel = document.querySelector("[data-zoom-level]")!;

  function render() {
    const view = views[phase];
    world().style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
    zoomLabel.textContent = `${Math.round(view.scale * 100)}%`;
    saveView();
  }

  function zoomAt(factor: number, cx: number, cy: number) {
    const view = views[phase];
    const scale = Math.min(2, Math.max(0.05, view.scale * factor));
    const k = scale / view.scale;
    view.x = cx - (cx - view.x) * k;
    view.y = cy - (cy - view.y) * k;
    view.scale = scale;
    render();
  }

  function fit() {
    const view = views[phase];
    const panelWidth =
      document.querySelector<HTMLElement>(".tuner_panel")!.offsetWidth + 32;
    const available = canvas.clientWidth - panelWidth;
    view.scale = Math.min(1, available / Math.max(1, world().scrollWidth));
    view.x = 0;
    view.y = 0;
    view.fitted = true;
    render();
  }

  function onWheel(event: WheelEvent, cx: number, cy: number) {
    event.preventDefault();
    const view = views[phase];
    if (event.ctrlKey || event.metaKey) {
      zoomAt(Math.exp(-event.deltaY * 0.01), cx, cy);
    } else {
      view.x -= event.deltaX;
      view.y -= event.deltaY;
      render();
    }
  }

  canvas.addEventListener(
    "wheel",
    (event) => onWheel(event, event.clientX, event.clientY),
    { passive: false },
  );

  let drag: { x: number; y: number } | null = null;
  canvas.addEventListener("pointerdown", (event) => {
    if ((event.target as Element).closest(".tuner_zoom")) return;
    const view = views[phase];
    drag = { x: event.clientX - view.x, y: event.clientY - view.y };
    canvas.classList.add("is-panning");
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const view = views[phase];
    view.x = event.clientX - drag.x;
    view.y = event.clientY - drag.y;
    render();
  });
  canvas.addEventListener("pointerup", () => {
    drag = null;
    canvas.classList.remove("is-panning");
  });

  // Hold space to pan across frames without clicking into them.
  function onKey(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (target.closest?.("input, select, textarea")) return;
    if (event.code === "Space") {
      root.classList.toggle("is-space", event.type === "keydown");
      event.preventDefault();
    } else if (event.type === "keydown" && event.key === "0") {
      fit();
    }
  }
  document.addEventListener("keydown", onKey);
  document.addEventListener("keyup", onKey);

  for (const button of document.querySelectorAll<HTMLButtonElement>(
    "[data-zoom]",
  )) {
    button.addEventListener("click", () => {
      const cx = canvas.clientWidth / 2;
      const cy = canvas.clientHeight / 2;
      if (button.dataset.zoom === "fit") fit();
      else zoomAt(button.dataset.zoom === "in" ? 1.25 : 0.8, cx, cy);
    });
  }

  // ---- View persistence ------------------------------------------------

  const VIEW_KEY = "mast-tuner-view";
  function saveView() {
    try {
      sessionStorage.setItem(
        VIEW_KEY,
        JSON.stringify({ phase, views, mobile: mobileToggle.checked }),
      );
    } catch {
      // Storage unavailable: the view just won't survive a reload.
    }
  }

  try {
    const stored = JSON.parse(sessionStorage.getItem(VIEW_KEY) ?? "null");
    if (stored?.views) {
      for (const key of Object.keys(views) as Phase[])
        if (stored.views[key]) Object.assign(views[key], stored.views[key]);
      if (stored.phase in views) phase = stored.phase;
      mobileToggle.checked = stored.mobile !== false;
      root.classList.toggle("is-desktop-only", !mobileToggle.checked);
    }
  } catch {
    // Ignore unreadable storage.
  }

  apply(document);
  syncControls();
  syncTokenControls();
  renderComments();
  updateStatus();
  showPhase(phase);
}
