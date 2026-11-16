import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { ManageScheduleCreateForm } from "./ManageScheduleCreateForm";

describe("ManageScheduleCreateForm", () => {
  it("일정 입력 폼을 추천 일정보다 먼저 보여준다", () => {
    render(
      <ManageScheduleCreateForm
        destinationCountry="CN"
        newScheduleDate="2026-08-03"
        newScheduleGuideMemo=""
        newSchedulePlaceID=""
        newScheduleTime=""
        newScheduleTitle=""
        newScheduleTransportMemo=""
        newScheduleType="sightseeing"
        onNewScheduleDateChange={vi.fn()}
        onNewScheduleGuideMemoChange={vi.fn()}
        onNewSchedulePlaceIDChange={vi.fn()}
        onNewScheduleTimeChange={vi.fn()}
        onNewScheduleTitleChange={vi.fn()}
        onNewScheduleTransportMemoChange={vi.fn()}
        onNewScheduleTypeChange={vi.fn()}
        onSubmitNewSchedule={(event) => event.preventDefault()}
        ownerPlaces={[]}
        ownerSchedules={[]}
        scheduleCreateError=""
        scheduleCreateSubmitting={false}
        tripEndDate="2026-08-06"
        tripStartDate="2026-08-03"
      />,
    );

    const submitButton = screen.getByRole("button", { name: "일정 추가" });
    const recommendationToggle = screen.getByText("상하이 추천 일정 보기");
    expect(submitButton.compareDocumentPosition(recommendationToggle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByLabelText("시간")).toHaveAttribute("type", "time");
  });

  function renderWithPlace(overrides: Partial<ComponentProps<typeof ManageScheduleCreateForm>> = {}) {
    const onNewSchedulePlaceIDChange = vi.fn();
    const onNewScheduleTitleChange = vi.fn();
    render(
      <ManageScheduleCreateForm
        destinationCountry="JP"
        newScheduleDate="2026-11-15"
        newScheduleGuideMemo=""
        newSchedulePlaceID=""
        newScheduleTime="10:00"
        newScheduleTitle=""
        newScheduleTransportMemo=""
        newScheduleType="sightseeing"
        onNewScheduleDateChange={vi.fn()}
        onNewScheduleGuideMemoChange={vi.fn()}
        onNewSchedulePlaceIDChange={onNewSchedulePlaceIDChange}
        onNewScheduleTimeChange={vi.fn()}
        onNewScheduleTitleChange={onNewScheduleTitleChange}
        onNewScheduleTransportMemoChange={vi.fn()}
        onNewScheduleTypeChange={vi.fn()}
        onSubmitNewSchedule={(event) => event.preventDefault()}
        ownerPlaces={[{ id: "place-1", name: "센소지", category: "sightseeing" }]}
        ownerSchedules={[]}
        scheduleCreateError=""
        scheduleCreateSubmitting={false}
        tripEndDate="2026-11-17"
        tripStartDate="2026-11-15"
        {...overrides}
      />,
    );
    return { onNewSchedulePlaceIDChange, onNewScheduleTitleChange };
  }

  it("제목이 비어 있을 때 장소를 연결하면 장소 이름을 일정 제목으로 채운다", async () => {
    const user = userEvent.setup();
    const { onNewSchedulePlaceIDChange, onNewScheduleTitleChange } = renderWithPlace();

    await user.selectOptions(screen.getByLabelText("연결 장소"), "place-1");

    expect(onNewSchedulePlaceIDChange).toHaveBeenCalledWith("place-1");
    expect(onNewScheduleTitleChange).toHaveBeenCalledWith("센소지");
  });

  it("이미 입력한 일정 제목은 장소를 연결해도 덮어쓰지 않는다", async () => {
    const user = userEvent.setup();
    const { onNewScheduleTitleChange } = renderWithPlace({ newScheduleTitle: "아침 산책" });

    await user.selectOptions(screen.getByLabelText("연결 장소"), "place-1");

    expect(onNewScheduleTitleChange).not.toHaveBeenCalled();
  });
});
