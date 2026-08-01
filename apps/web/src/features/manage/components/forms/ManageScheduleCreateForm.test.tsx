import { render, screen } from "@testing-library/react";
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
});
