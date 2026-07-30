type UpdateServiceWorker = (reloadPage?: boolean) => Promise<void>;

type CoordinatePwaUpdateOptions = {
  hasPendingMutation: () => boolean;
  hasUnsavedFormChanges: () => boolean;
  onBlocked: () => void;
  updateServiceWorker: UpdateServiceWorker;
};

function snapshotForm(form: HTMLFormElement) {
  return JSON.stringify(
    Array.from(form.elements).map((control) => {
      if (control instanceof HTMLInputElement) {
        if (control.type === "file") {
          return [control.name, control.type, Array.from(control.files ?? []).map((file) => file.name)];
        }
        if (control.type === "checkbox" || control.type === "radio") {
          return [control.name, control.type, control.value, control.checked];
        }
        return [control.name, control.type, control.value];
      }
      if (control instanceof HTMLTextAreaElement) {
        return [control.name, "textarea", control.value];
      }
      if (control instanceof HTMLSelectElement) {
        return [
          control.name,
          "select",
          Array.from(control.selectedOptions).map((option) => option.value),
        ];
      }
      return null;
    }),
  );
}

export function createPwaFormChangeTracker(root: Document = document) {
  const initialSnapshots = new Map<HTMLFormElement, string>();

  const captureInitialSnapshot = (event: FocusEvent) => {
    const control = event.target;
    if (!(control instanceof Element)) return;
    const form = control.closest("form");
    if (form && !initialSnapshots.has(form)) {
      initialSnapshots.set(form, snapshotForm(form));
    }
  };

  const refreshAfterReset = (event: Event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    window.setTimeout(() => initialSnapshots.set(form, snapshotForm(form)), 0);
  };

  root.addEventListener("focusin", captureInitialSnapshot);
  root.addEventListener("reset", refreshAfterReset);

  return {
    dispose() {
      root.removeEventListener("focusin", captureInitialSnapshot);
      root.removeEventListener("reset", refreshAfterReset);
      initialSnapshots.clear();
    },
    hasUnsavedChanges() {
      for (const [form, initialSnapshot] of initialSnapshots) {
        if (!form.isConnected) {
          initialSnapshots.delete(form);
          continue;
        }
        if (snapshotForm(form) !== initialSnapshot) return true;
      }
      return false;
    },
  };
}

export function coordinatePwaUpdate({
  hasPendingMutation,
  hasUnsavedFormChanges,
  onBlocked,
  updateServiceWorker,
}: CoordinatePwaUpdateOptions) {
  if (hasUnsavedFormChanges() || hasPendingMutation()) {
    onBlocked();
    return;
  }

  void updateServiceWorker(true);
}
