import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  coordinatePwaUpdate,
  createPwaFormChangeTracker,
} from "./pwaUpdateCoordinator";

function ControlledForm() {
  const [title, setTitle] = useState("");
  return (
    <form>
      <label>
        여행 제목
        <input value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
    </form>
  );
}

describe("coordinatePwaUpdate", () => {
  let disposeTracker: (() => void) | undefined;

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    disposeTracker?.();
    disposeTracker = undefined;
    vi.useRealTimers();
  });

  it("수정 중인 폼이 없으면 새 버전을 즉시 적용한다", () => {
    const tracker = createPwaFormChangeTracker();
    disposeTracker = tracker.dispose;
    const updateServiceWorker = vi.fn().mockResolvedValue(undefined);
    const onBlocked = vi.fn();

    coordinatePwaUpdate({
      hasPendingMutation: () => false,
      hasUnsavedFormChanges: tracker.hasUnsavedChanges,
      onBlocked,
      updateServiceWorker,
    });

    expect(updateServiceWorker).toHaveBeenCalledWith(true);
    expect(onBlocked).not.toHaveBeenCalled();
  });

  it("입력 중인 폼이 있으면 자동 업데이트를 멈추고 사용자에게 안내한다", () => {
    const tracker = createPwaFormChangeTracker();
    disposeTracker = tracker.dispose;
    render(<ControlledForm />);
    const input = screen.getByRole("textbox", { name: "여행 제목" });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "상하이 여행" } });
    const updateServiceWorker = vi.fn().mockResolvedValue(undefined);
    const onBlocked = vi.fn();

    coordinatePwaUpdate({
      hasPendingMutation: () => false,
      hasUnsavedFormChanges: tracker.hasUnsavedChanges,
      onBlocked,
      updateServiceWorker,
    });

    expect(onBlocked).toHaveBeenCalledTimes(1);
    expect(updateServiceWorker).not.toHaveBeenCalled();
  });

  it("서버 변경 요청이 진행 중이면 자동 업데이트를 멈춘다", () => {
    const updateServiceWorker = vi.fn().mockResolvedValue(undefined);
    const onBlocked = vi.fn();

    coordinatePwaUpdate({
      hasPendingMutation: () => true,
      hasUnsavedFormChanges: () => false,
      onBlocked,
      updateServiceWorker,
    });

    expect(onBlocked).toHaveBeenCalledTimes(1);
    expect(updateServiceWorker).not.toHaveBeenCalled();
  });
});
