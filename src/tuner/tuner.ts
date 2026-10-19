/**
 * Tuner behavior: dial controls, live frame updates, pan/zoom, and
 * saving back to src/dials.ts through the dev endpoints in
 * ./integration.mjs.
 *
 *  - Token dials set `--dial-*` on every frame's <html> (and the tuner's
 *    own, so the panel follows along). No reload.
 *  - Layout dials post their positions to /__mast/dials/preview and
 *    reload the frames, which re-render through getLayout().
 */
import type { Dial } from "@/dials.ts";

type Value = string | number;

interface Data {
  dials: Record<string, Dial>;
  presets: Record<
    string,
    { description: string; values: Record<string, Value> }
  >;
  layout: Record<string, Value>;
}

const dataEl = document.getElementById("tuner-data");
if (dataEl) init(JSON.parse(dataEl.textContent ?? "{}") as Data);

function init({ dials, presets, layout }: Data) {
  const root = document.documentElement;
  const canvas = document.querySelector<HTMLElement>("[data-tuner-canvas]")!;
  const world = document.querySelector<HTMLElement>("[data-tuner-world]")!;
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

  // Saved values come from the file; layout ones may carry an unsaved
  // preview left from before a reload, which the server cleared on start
  // but not across tuner reloads — so read both.
  const saved: Record<string, Value> = {};
  for (const [name, d] of Object.entries(dials)) saved[name] = d.value;
  const state: Record<string, Value> = { ...saved, ...layout };
  let scheme = "light dark";

  const isToken = (name: string) => dials[name]?.kind === "token";
  const cssVar = (name: string) =>
    `--dial-${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;

  // ---- Applying values -------------------------------------------------

  function applyTokens(doc: Document) {
    for (const name of Object.keys(dials)) {
      if (isToken(name))
        doc.documentElement.style.setProperty(
          cssVar(name),
          String(state[name]),
        );
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

  function setValue(name: string, value: Value) {
    state[name] = value;
    syncControls();
    if (isToken(name)) {
      for (const doc of [document, ...frameDocs()]) applyTokens(doc);
      frames.forEach(measure);
    } else {
      queueLayoutPreview();
    }
    updateStatus();
  }

  let previewTimer = 0;
  function queueLayoutPreview() {
    clearTimeout(previewTimer);
    previewTimer = window.setTimeout(async () => {
      const values: Record<string, Value> = {};
      for (const name of Object.keys(dials))
        if (!isToken(name)) values[name] = state[name];
      await post("preview", values);
      frames.forEach((f) => f.contentWindow?.location.reload());
    }, 120);
  }

  // ---- Controls --------------------------------------------------------

  const ranges = [
    ...document.querySelectorAll<HTMLInputElement>('input[type="range"]'),
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
        d.kind === "layout"
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
      if (readout) readout.textContent = Number(value).toFixed(2);
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
      if (d.kind === "layout")
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
    let layoutChanged = false;
    for (const [name, value] of Object.entries(preset.values)) {
      if (!(name in dials)) continue;
      if (!isToken(name) && state[name] !== value) layoutChanged = true;
      state[name] = value;
    }
    syncControls();
    for (const doc of [document, ...frameDocs()]) applyTokens(doc);
    frames.forEach(measure);
    if (layoutChanged) queueLayoutPreview();
    updateStatus();
  });

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

  function changed(): string[] {
    return Object.keys(dials).filter(
      (name) => String(state[name]) !== String(saved[name]),
    );
  }

  function updateStatus(message?: string) {
    const diff = changed();
    saveBtn.disabled = resetBtn.disabled = diff.length === 0;
    statusEl.textContent =
      message ??
      (diff.length
        ? `Unsaved: ${diff.map((n) => dials[n].label).join(", ")}`
        : "Saved to src/dials.ts");
  }

  saveBtn.addEventListener("click", async () => {
    const values = Object.fromEntries(changed().map((n) => [n, state[n]]));
    const ok = await post("save", values);
    if (!ok) return updateStatus("Couldn't save. Check the dev server log.");
    Object.assign(saved, values);
    updateStatus();
    // Saving edits dials.ts, so the dev server reloads this page; the
    // view (pan, zoom) survives through sessionStorage.
  });

  resetBtn.addEventListener("click", () => {
    const layoutChanged = changed().some((n) => !isToken(n));
    Object.assign(state, saved);
    syncControls();
    for (const doc of [document, ...frameDocs()]) applyTokens(doc);
    frames.forEach(measure);
    if (layoutChanged) queueLayoutPreview();
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
      const text = `Mast dial positions (src/dials.ts):\n${lines.join("\n")}`;
      try {
        await navigator.clipboard.writeText(text);
        updateStatus("Copied dial positions to the clipboard");
      } catch {
        updateStatus("Clipboard unavailable");
      }
    });

  async function post(action: "preview" | "save", values: object) {
    try {
      const res = await fetch(`/__mast/dials/${action}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      return res.ok;
    } catch {
      return false;
    }
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
      if (!doc) return;
      const style = doc.createElement("style");
      style.textContent = FRAME_CSS;
      doc.head.append(style);
      applyTokens(doc);
      applyScheme(doc);
      measure(frame);
      new ResizeObserver(() => measure(frame)).observe(doc.body);
      // Wheel events inside a frame never reach this document; forward
      // them so the canvas pans and zooms from anywhere.
      doc.addEventListener(
        "wheel",
        (event) => {
          const rect = frame.getBoundingClientRect();
          onWheel(
            event,
            rect.left + event.clientX * view.scale,
            rect.top + event.clientY * view.scale,
          );
        },
        { passive: false },
      );
      doc.addEventListener("keydown", onKey);
    });
  }

  // ---- Pan and zoom ----------------------------------------------------

  const view = { x: 0, y: 0, scale: 0.2 };
  const zoomLabel = document.querySelector("[data-zoom-level]")!;

  function render() {
    world.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
    zoomLabel.textContent = `${Math.round(view.scale * 100)}%`;
    saveView();
  }

  function zoomAt(factor: number, cx: number, cy: number) {
    const scale = Math.min(2, Math.max(0.05, view.scale * factor));
    const k = scale / view.scale;
    view.x = cx - (cx - view.x) * k;
    view.y = cy - (cy - view.y) * k;
    view.scale = scale;
    render();
  }

  function fit() {
    const panelWidth =
      document.querySelector<HTMLElement>(".tuner_panel")!.offsetWidth + 32;
    const available = canvas.clientWidth - panelWidth;
    view.scale = Math.min(1, available / world.scrollWidth);
    view.x = 0;
    view.y = 0;
    render();
  }

  function onWheel(event: WheelEvent, cx: number, cy: number) {
    event.preventDefault();
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
    drag = { x: event.clientX - view.x, y: event.clientY - view.y };
    canvas.classList.add("is-panning");
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!drag) return;
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
  for (const frame of frames)
    frame.addEventListener("load", () =>
      frame.contentDocument?.addEventListener("keyup", onKey),
    );

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
        JSON.stringify({ ...view, mobile: mobileToggle.checked }),
      );
    } catch {
      // Storage unavailable: the view just won't survive a reload.
    }
  }

  let restored = false;
  try {
    const stored = JSON.parse(sessionStorage.getItem(VIEW_KEY) ?? "null");
    if (stored) {
      Object.assign(view, { x: stored.x, y: stored.y, scale: stored.scale });
      mobileToggle.checked = stored.mobile !== false;
      root.classList.toggle("is-desktop-only", !mobileToggle.checked);
      restored = true;
    }
  } catch {
    // Ignore unreadable storage.
  }

  applyTokens(document);
  syncControls();
  updateStatus();
  if (restored) render();
  else fit();
}
