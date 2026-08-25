import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ScheduleCard } from "./ScheduleCard";

describe("ScheduleCard", () => {
  it("일반 여행 안내는 가리지 않고 예약 메모만 민감 정보로 보호한다", () => {
    render(
      <ScheduleCard
        index={0}
        isCompleted={false}
        isLast
        item={{
          id: "schedule-yu-garden",
          date: "2026-08-14",
          time: "09:30",
          type: "sightseeing",
          title: "예원 정원과 올드타운",
          reservationMemo: "예약 번호 ABC123",
          guideMemo: "오전 일찍 방문하면 혼잡을 줄일 수 있습니다.",
        }}
        onMove={vi.fn()}
        onToggleComplete={vi.fn()}
        showGuideMemo
      />,
    );

    expect(screen.getByText("오전 일찍 방문하면 혼잡을 줄일 수 있습니다.")).toBeVisible();
    expect(screen.getByText("예약 ••••")).toBeVisible();
    expect(screen.getByRole("button", { name: "민감 정보 보기" })).toBeVisible();
  });

  it("실제 여행의 안내 메모는 기본적으로 가린다", () => {
    render(
      <ScheduleCard
        index={0}
        isCompleted={false}
        isLast
        item={{
          id: "owner-schedule",
          date: "2026-08-14",
          time: "09:30",
          type: "sightseeing",
          title: "개인 일정",
          guideMemo: "예약자명과 예약번호 ABC123",
        }}
        onMove={vi.fn()}
        onToggleComplete={vi.fn()}
      />,
    );

    expect(screen.queryByText("예약자명과 예약번호 ABC123")).not.toBeInTheDocument();
    expect(screen.getByText("예약자••••")).toBeVisible();
    expect(screen.getByRole("button", { name: "민감 정보 보기" })).toBeVisible();
  });

  // scheduleTypeIcons에 없는 type 값이 들어오면(레거시 데이터, 다른 클라이언트가
  // 보낸 값 등) 아이콘 컴포넌트가 undefined가 되어 "Element type is invalid"
  // 크래시로 화면 전체가 죽었다 — 실제로 겪은 뒤 추가한 회귀 테스트다.
  it("알 수 없는 일정 종류여도 크래시 없이 기본 라벨로 표시한다", () => {
    render(
      <ScheduleCard
        index={0}
        isCompleted={false}
        isLast
        item={{
          id: "schedule-unknown-type",
          date: "2026-08-14",
          time: "10:00",
          type: "visit" as unknown as "etc",
          title: "알 수 없는 종류의 일정",
        }}
        onMove={vi.fn()}
        onToggleComplete={vi.fn()}
      />,
    );

    expect(screen.getByText("알 수 없는 종류의 일정")).toBeVisible();
    expect(screen.getByText("일정")).toBeVisible();
  });
});

describe("ScheduleCard 구조와 순서 편집", () => {
  const baseItem = {
    id: "schedule-1",
    date: "2026-08-20",
    time: "10:30",
    type: "sightseeing" as const,
    title: "센간엔 정원",
  };

  it("평소에는 순서 변경 버튼을 보여주지 않는다", () => {
    render(
      <ScheduleCard
        index={0}
        isCompleted={false}
        isLast={false}
        item={baseItem}
        onMove={vi.fn()}
        onToggleComplete={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "센간엔 정원 위로 이동" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "센간엔 정원 완료" })).toBeVisible();
  });

  it("순서 편집 모드에서만 위·아래 이동 버튼을 보여준다", async () => {
    const onMove = vi.fn();
    render(
      <ScheduleCard
        index={1}
        isCompleted={false}
        isLast={false}
        isReordering
        item={baseItem}
        onMove={onMove}
        onToggleComplete={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "센간엔 정원 위로 이동" }));

    expect(onMove).toHaveBeenCalledWith("schedule-1", "up");
  });

  it("완료한 일정은 완료 취소로 다시 되돌릴 수 있다", async () => {
    const onToggleComplete = vi.fn();
    render(
      <ScheduleCard
        index={0}
        isCompleted
        isLast
        item={baseItem}
        onMove={vi.fn()}
        onToggleComplete={onToggleComplete}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "센간엔 정원 완료 취소" }));

    expect(onToggleComplete).toHaveBeenCalledWith("schedule-1");
  });

  it("공유 보기에서는 완료와 순서 변경 버튼을 모두 감춘다", () => {
    render(
      <ScheduleCard
        index={0}
        isCompleted={false}
        isLast
        isReadOnly
        isReordering
        item={baseItem}
        onMove={vi.fn()}
        onToggleComplete={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "센간엔 정원 완료" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "센간엔 정원 위로 이동" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "센간엔 정원" })).toBeVisible();
  });

  it("이동 일정에서는 유형과 이동 메모 제목을 중복해서 보여주지 않는다", () => {
    render(
      <ScheduleCard
        index={0}
        isCompleted={false}
        isLast
        item={{
          ...baseItem,
          type: "move",
          title: "푸둥공항 도착",
          transportMemo: "공항철도로 숙소까지 이동합니다.",
        }}
        onMove={vi.fn()}
        onToggleComplete={vi.fn()}
      />,
    );

    expect(screen.getAllByText("이동")).toHaveLength(1);
    expect(screen.getByText("공항철도로 숙소까지 이동합니다.")).toBeVisible();
  });

  it("다른 유형의 일정에서는 이동 메모의 의미를 표시한다", () => {
    render(
      <ScheduleCard
        index={0}
        isCompleted={false}
        isLast
        item={{
          ...baseItem,
          transportMemo: "지하철로 이동합니다.",
        }}
        onMove={vi.fn()}
        onToggleComplete={vi.fn()}
      />,
    );

    expect(screen.getByText("이동")).toBeVisible();
  });
});

describe("ScheduleCard 장소 시트 연결", () => {
  const place = {
    id: "place-1",
    name: "센간엔 정원",
    category: "sightseeing" as const,
  };

  it("장소가 있으면 길찾기 칩으로 시트를 연다", async () => {
    const onOpenPlace = vi.fn();
    render(
      <ScheduleCard
        index={0}
        isCompleted={false}
        isLast
        item={{
          id: "schedule-1",
          date: "2026-08-20",
          time: "10:30",
          type: "sightseeing" as const,
          title: "센간엔 정원 관람",
          placeId: "place-1",
        }}
        onMove={vi.fn()}
        onOpenPlace={onOpenPlace}
        onToggleComplete={vi.fn()}
        place={place}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "센간엔 정원 길찾기" }));

    expect(onOpenPlace).toHaveBeenCalledWith(place);
  });

  it("연결된 장소가 없으면 길찾기 칩을 넣지 않는다", () => {
    render(
      <ScheduleCard
        index={0}
        isCompleted={false}
        isLast
        item={{
          id: "schedule-2",
          date: "2026-08-20",
          time: "12:00",
          type: "etc" as const,
          title: "자유 시간",
        }}
        onMove={vi.fn()}
        onOpenPlace={vi.fn()}
        onToggleComplete={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: /길찾기/ })).not.toBeInTheDocument();
  });
});
