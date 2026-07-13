import type { TripDates } from "../../../shared/date";

type TripDateEditorProps = {
  tripDates: TripDates;
  updateTripDate: (field: "startDate" | "endDate", value: string) => void;
};

// 즉흥적인 일정 변경을 위해 출발일과 입국일을 홈 화면에서 바로 수정한다.
export function TripDateEditor({ tripDates, updateTripDate }: TripDateEditorProps) {
  return (
    <section className="section-block">
      <details className="date-details">
        <summary>여행 날짜 조정</summary>
        <div className="date-form" aria-label="여행 날짜 변경">
          <label>
            출발
            <input
              type="date"
              value={tripDates.startDate}
              onChange={(event) => updateTripDate("startDate", event.target.value)}
            />
          </label>
          <label>
            입국
            <input
              type="date"
              value={tripDates.endDate}
              onChange={(event) => updateTripDate("endDate", event.target.value)}
            />
          </label>
        </div>
      </details>
    </section>
  );
}
