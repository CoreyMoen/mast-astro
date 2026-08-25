/**
 * Modal: native <dialog> open/close with optional open-on-load + cooldown.
 * Direct port of Mast's modal.js.
 */
function initModals() {
  const dialogs = document.querySelectorAll<HTMLDialogElement>("dialog");
  if (dialogs.length === 0) return;

  document.addEventListener("click", handleModalClicks);
  dialogs.forEach(setupDialogClickOutside);
  dialogs.forEach(handleAutoOpenModal);
}

function handleModalClicks(e: MouseEvent) {
  const target = e.target;
  if (!(target instanceof Element)) return;

  // Show-modal buttons are buttons that immediately follow a dialog.
  const trigger = target.closest("dialog + button");
  if (trigger) {
    e.preventDefault();
    const dialog = trigger.previousElementSibling;
    if (dialog instanceof HTMLDialogElement) {
      dialog.showModal();
    }
    return;
  }

  if (
    target.closest(
      'dialog button.modal_close-button, dialog button[data-modal="close"]',
    )
  ) {
    e.preventDefault();
    const dialog = target.closest("dialog");
    dialog?.close();
  }
}

function setupDialogClickOutside(dialog: HTMLDialogElement) {
  dialog.addEventListener("click", (e) => {
    // Only close if clicking on the dialog backdrop (not its content).
    if (e.target === dialog) {
      dialog.close();
    }
  });

  dialog.addEventListener("close", () => {
    handleModalClose(dialog);
  });
}

function handleAutoOpenModal(dialog: HTMLDialogElement) {
  if (dialog.dataset.modalOpenOnLoad !== "true") return;

  // Only the cooldown needs a stable id; without one the modal still
  // opens on every load.
  const cooldownDays =
    parseInt(dialog.dataset.modalCooldownDays ?? "", 10) || 0;
  if (cooldownDays > 0) {
    const modalId = getModalId(dialog);
    if (modalId && isInCooldown(modalId)) return;
  }

  dialog.showModal();
}

function handleModalClose(dialog: HTMLDialogElement) {
  const cooldownDays = parseInt(dialog.dataset.modalCooldownDays ?? "", 10);
  if (cooldownDays > 0) {
    const modalId = getModalId(dialog);
    if (modalId) {
      storeCooldownTimestamp(modalId, cooldownDays);
    }
  }
}

function getModalId(dialog: HTMLDialogElement): string | null {
  const parent = dialog.parentElement;
  if (!parent || !parent.id) return null;
  return parent.id;
}

function isInCooldown(modalId: string): boolean {
  try {
    const storageKey = `modal-cooldown-${modalId}`;
    const cooldownUntil = localStorage.getItem(storageKey);
    if (!cooldownUntil) return false;

    if (Date.now() > parseInt(cooldownUntil, 10)) {
      localStorage.removeItem(storageKey);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function storeCooldownTimestamp(modalId: string, days: number) {
  try {
    const storageKey = `modal-cooldown-${modalId}`;
    const cooldownUntil = Date.now() + days * 24 * 60 * 60 * 1000;
    localStorage.setItem(storageKey, cooldownUntil.toString());
  } catch {
    // Storage unavailable; skip cooldown.
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initModals);
} else {
  initModals();
}
