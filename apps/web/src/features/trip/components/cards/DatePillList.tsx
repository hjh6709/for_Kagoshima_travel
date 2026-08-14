import { forwardRef } from "react";
import { formatShortDate } from "../../../../shared/date";

type DatePillListProps = {
  dates: string[];
  getDisplayDate: (dateStr: string) => string;
  onSelectDate: (date: string) => void;
  selectedDate: string;
};

const weekdayNames = ["일", "월", "화", "수", "목", "금", "토"];

// 날짜 필 목록. 시각적으로는 요일·일·DAY 3단이지만, 접근 가능한 이름은
// 기존 화면과 같은 "8/20(목)" 형식을 유지한다(기존 테스트가 이 이름을 고정한다).
export const DatePillList = forwardRef<HTMLDivElement, DatePillListProps>(function DatePillList(
  { dates, getDisplayDate, onSelectDate, selectedDate },
  ref,
) {
  return (
    <div
      aria-label="여행 날짜 선택"
      className={`date-tabs ${dates.length <= 4 ? "fit-tabs" : "scroll-tabs"}`}
      ref={ref}
      style={
        dates.length <= 4
          ? // minmax(0, 1fr)로 두면 트랙이 내용보다 작아질 수 있어, 195px에서 날짜가 잘렸다.
            // min-content를 하한으로 두면 자리가 부족할 때 트랙이 줄지 않고 트랙 컨테이너가
            // 가로로 스크롤된다(.date-tabs는 overflow-x: auto).
            { gridTemplateColumns: `repeat(${dates.length}, minmax(min-content, 1fr))` }
          : undefined
      }
    >
      {dates.map((date, index) => {
        const displayDate = getDisplayDate(date);
        const parsed = new Date(`${displayDate}T00:00:00`);
        const isSelected = date === selectedDate;
        return (
          <button
            aria-label={formatShortDate(displayDate)}
            aria-pressed={isSelected}
            className={isSelected ? "active" : ""}
            key={date}
            onClick={() => onSelectDate(date)}
            type="button"
          >
            <span className="date-pill-weekday">{weekdayNames[parsed.getDay()]}</span>
            <span className="date-pill-day">{parsed.getDate()}</span>
            <span className="date-pill-badge">DAY {index + 1}</span>
          </button>
        );
      })}
    </div>
  );
});
