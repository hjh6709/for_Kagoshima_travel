import { PlusCircle } from "lucide-react";
import { flightDirectionOptions, type FlightDirection } from "../../../../shared/travelOptions";
import type { TripManagePageProps } from "../../manageTypes";

type ManageFlightCreateFormProps = Pick<
  TripManagePageProps,
  | "flightCreateError"
  | "flightCreateSubmitting"
  | "newFlightAirline"
  | "newFlightArrivalAirport"
  | "newFlightArrivalDate"
  | "newFlightArrivalTime"
  | "newFlightDepartureAirport"
  | "newFlightDepartureDate"
  | "newFlightDepartureTime"
  | "newFlightDirection"
  | "newFlightLabel"
  | "newFlightMemo"
  | "newFlightNumber"
  | "onNewFlightAirlineChange"
  | "onNewFlightArrivalAirportChange"
  | "onNewFlightArrivalDateChange"
  | "onNewFlightArrivalTimeChange"
  | "onNewFlightDepartureAirportChange"
  | "onNewFlightDepartureDateChange"
  | "onNewFlightDepartureTimeChange"
  | "onNewFlightDirectionChange"
  | "onNewFlightLabelChange"
  | "onNewFlightMemoChange"
  | "onNewFlightNumberChange"
  | "onSubmitNewFlight"
> & {
  tripEndDate: string;
  tripStartDate: string;
};

// 여행 관리 화면의 항공편 추가 폼만 담당한다. 날짜 범위와 저장 동작은 상위 상태를 받아 표시한다.
export function ManageFlightCreateForm({
  flightCreateError,
  flightCreateSubmitting,
  newFlightAirline,
  newFlightArrivalAirport,
  newFlightArrivalDate,
  newFlightArrivalTime,
  newFlightDepartureAirport,
  newFlightDepartureDate,
  newFlightDepartureTime,
  newFlightDirection,
  newFlightLabel,
  newFlightMemo,
  newFlightNumber,
  onNewFlightAirlineChange,
  onNewFlightArrivalAirportChange,
  onNewFlightArrivalDateChange,
  onNewFlightArrivalTimeChange,
  onNewFlightDepartureAirportChange,
  onNewFlightDepartureDateChange,
  onNewFlightDepartureTimeChange,
  onNewFlightDirectionChange,
  onNewFlightLabelChange,
  onNewFlightMemoChange,
  onNewFlightNumberChange,
  onSubmitNewFlight,
  tripEndDate,
  tripStartDate,
}: ManageFlightCreateFormProps) {
  return (
    <section className="owner-linked-data-section">
      <div className="section-title-row compact-title-row">
        <div>
          <h3>항공편 추가</h3>
          <p className="section-caption">공유 화면 항공 정보에 표시할 항공편을 서버에 저장합니다.</p>
        </div>
      </div>

      <form className="auth-form compact-owner-form" onSubmit={onSubmitNewFlight}>
        <div className="form-grid-two">
          <label>
            구분
            <select
              onChange={(event) => onNewFlightDirectionChange(event.target.value as FlightDirection)}
              value={newFlightDirection}
            >
              {flightDirectionOptions.map(([direction, label]) => (
                <option key={direction} value={direction}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            항공편 이름
            <input
              onChange={(event) => onNewFlightLabelChange(event.target.value)}
              placeholder="예: 출국 항공편"
              required
              type="text"
              value={newFlightLabel}
            />
          </label>
        </div>

        <div className="form-grid-two">
          <label>
            항공사
            <input
              onChange={(event) => onNewFlightAirlineChange(event.target.value)}
              placeholder="예: 대한항공"
              type="text"
              value={newFlightAirline}
            />
          </label>
          <label>
            편명
            <input
              autoCapitalize="characters"
              onChange={(event) => onNewFlightNumberChange(event.target.value)}
              placeholder="예: KE123"
              type="text"
              value={newFlightNumber}
            />
          </label>
        </div>

        {/* 항공사·편명 다음에 출발 6칸, 도착 6칸이 똑같은 모양으로 계속 이어져서
            어디까지가 출발이고 어디부터가 도착인지 시각적으로 안 갈렸다 — 구분선
            없이 입력칸만 계속 붙어 있는 게 "덕지덕지" 인상의 실제 원인이었다.
            fieldset으로 출발/도착을 각각 눈에 보이는 구획으로 나눈다. */}
        <fieldset className="form-section-fieldset">
          <legend>출발</legend>
          <label>
            출발 공항
            <input
              onChange={(event) => onNewFlightDepartureAirportChange(event.target.value)}
              placeholder="예: 인천"
              required
              type="text"
              value={newFlightDepartureAirport}
            />
          </label>
          <div className="form-grid-two">
            <label>
              날짜
              <input
                max={tripEndDate}
                min={tripStartDate}
                onChange={(event) => onNewFlightDepartureDateChange(event.target.value)}
                required
                type="date"
                value={newFlightDepartureDate}
              />
            </label>
            <label>
              시간
              <input
                onChange={(event) => onNewFlightDepartureTimeChange(event.target.value)}
                required
                type="time"
                value={newFlightDepartureTime}
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="form-section-fieldset">
          <legend>도착</legend>
          <label>
            도착 공항
            <input
              onChange={(event) => onNewFlightArrivalAirportChange(event.target.value)}
              placeholder="예: 도쿄"
              required
              type="text"
              value={newFlightArrivalAirport}
            />
          </label>
          <div className="form-grid-two">
            <label>
              날짜
              <input
                min={newFlightDepartureDate || tripStartDate}
                onChange={(event) => onNewFlightArrivalDateChange(event.target.value)}
                type="date"
                value={newFlightArrivalDate}
              />
            </label>
            <label>
              시간
              <input
                onChange={(event) => onNewFlightArrivalTimeChange(event.target.value)}
                type="time"
                value={newFlightArrivalTime}
              />
            </label>
          </div>
        </fieldset>

        <label>
          항공 메모
          <textarea
            onChange={(event) => onNewFlightMemoChange(event.target.value)}
            placeholder="예: 터미널, 수하물, 체크인 주의사항"
            rows={2}
            value={newFlightMemo}
          />
        </label>

        {flightCreateError && <p className="form-error">{flightCreateError}</p>}

        <button className="primary-button" disabled={flightCreateSubmitting} type="submit">
          <PlusCircle size={18} />
          {flightCreateSubmitting ? "항공편 추가 중" : "항공편 추가"}
        </button>
      </form>
    </section>
  );
}
