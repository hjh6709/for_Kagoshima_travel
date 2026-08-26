import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatKoreanDate } from "../date";
import { BottomSheet } from "./BottomSheet";

type DateRangeCalendarProps = {
  ariaLabel: string;
  endDate: string;
  minDate?: string;
  onClose: () => void;
  onConfirm: (startDate: string, endDate: string) => void;
  startDate: string;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// 월 하나를 7칸짜리 주 배열로 만든다. 앞뒤 빈 칸은 null.
function buildMonthWeeks(year: number, month: number): (string | null)[][] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array(firstWeekday).fill(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(toDateString(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (string | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7) weeks.push(cells.slice(index, index + 7));
  return weeks;
}

// 여행 시작일·종료일을 브라우저 기본 <input type="date"> 대신 실제로 그린 달력
// 그리드에서 고른다. 네이티브 피커는 OS/브라우저마다 다르게 생겨서 "웹 폼"
// 느낌을 벗어날 수 없었다 — 탭 하나로 시작일, 다시 탭해서 종료일을 고르는
// 범위 선택 방식은 예약 앱들이 공통으로 쓰는 문법이다.
export function DateRangeCalendar({
  ariaLabel,
  endDate,
  minDate,
  onClose,
  onConfirm,
  startDate,
}: DateRangeCalendarProps) {
  const initial = startDate || minDate || new Date().toISOString().slice(0, 10);
  const [viewYear, setViewYear] = useState(Number(initial.slice(0, 4)));
  const [viewMonth, setViewMonth] = useState(Number(initial.slice(5, 7)) - 1);
  const [pendingStart, setPendingStart] = useState(startDate);
  const [pendingEnd, setPendingEnd] = useState(endDate);

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((year) => year - 1);
      setViewMonth(11);
    } else {
      setViewMonth((month) => month - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((year) => year + 1);
      setViewMonth(0);
    } else {
      setViewMonth((month) => month + 1);
    }
  };

  const handleSelectDay = (day: string) => {
    if (!pendingStart || pendingEnd) {
      setPendingStart(day);
      setPendingEnd("");
      return;
    }
    if (day < pendingStart) {
      setPendingStart(day);
      setPendingEnd("");
      return;
    }
    setPendingEnd(day);
  };

  const weeks = buildMonthWeeks(viewYear, viewMonth);
  const canConfirm = Boolean(pendingStart);

  return (
    <BottomSheet ariaLabel={ariaLabel} onClose={onClose}>
      <div className="date-range-calendar">
        <div className="date-range-calendar-header">
          <button
            aria-label="이전 달"
            className="date-range-calendar-nav"
            onClick={goToPrevMonth}
            type="button"
          >
            <ChevronLeft aria-hidden="true" size={20} />
          </button>
          <strong>{viewYear}년 {viewMonth + 1}월</strong>
          <button
            aria-label="다음 달"
            className="date-range-calendar-nav"
            onClick={goToNextMonth}
            type="button"
          >
            <ChevronRight aria-hidden="true" size={20} />
          </button>
        </div>

        <div className="date-range-calendar-weekdays" aria-hidden="true">
          {WEEKDAYS.map((weekday) => (
            <span key={weekday}>{weekday}</span>
          ))}
        </div>

        <div className="date-range-calendar-grid">
          {weeks.map((week, weekIndex) => (
            <div className="date-range-calendar-week" key={weekIndex}>
              {week.map((day, dayIndex) => {
                if (!day) return <span aria-hidden="true" className="date-range-calendar-cell empty" key={dayIndex} />;

                const isDisabled = Boolean(minDate) && day < (minDate as string);
                const isStart = day === pendingStart;
                const isEnd = day === pendingEnd;
                const isInRange = Boolean(
                  pendingStart && pendingEnd && day > pendingStart && day < pendingEnd,
                );

                return (
                  <button
                    aria-current={isStart || isEnd ? "date" : undefined}
                    aria-label={formatKoreanDate(day)}
                    className={`date-range-calendar-cell${isStart ? " is-start" : ""}${isEnd ? " is-end" : ""}${isInRange ? " is-in-range" : ""}`}
                    disabled={isDisabled}
                    key={day}
                    onClick={() => handleSelectDay(day)}
                    type="button"
                  >
                    {Number(day.slice(8, 10))}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="date-range-calendar-summary">
          <span>{pendingStart ? formatKoreanDate(pendingStart) : "출발일 선택"}</span>
          <span className="date-range-calendar-summary-arrow">→</span>
          <span>{pendingEnd ? formatKoreanDate(pendingEnd) : "종료일 선택(선택)"}</span>
        </div>

        <div className="date-range-calendar-actions">
          {pendingStart && !pendingEnd && (
            <button
              className="secondary-button compact-button"
              onClick={() => onConfirm(pendingStart, "")}
              type="button"
            >
              당일 여행으로 확정
            </button>
          )}
          <button
            className="primary-button compact-button"
            disabled={!canConfirm}
            onClick={() => onConfirm(pendingStart, pendingEnd)}
            type="button"
          >
            {pendingEnd ? "이 기간으로 확정" : "출발일만 확정"}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
