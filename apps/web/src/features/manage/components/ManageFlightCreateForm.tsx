import { PlusCircle } from "lucide-react";
import { flightDirectionOptions, type FlightDirection } from "../../../shared/travelOptions";
import type { TripManagePageProps } from "../manageTypes";

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

        <div className="form-grid-two">
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
        </div>

        <div className="form-grid-two">
          <label>
            출발 날짜
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
            출발 시간
            <input
              onChange={(event) => onNewFlightDepartureTimeChange(event.target.value)}
              placeholder="예: 10:30"
              required
              type="text"
              value={newFlightDepartureTime}
            />
          </label>
        </div>

        <div className="form-grid-two">
          <label>
            도착 날짜
            <input
              min={newFlightDepartureDate || tripStartDate}
              onChange={(event) => onNewFlightArrivalDateChange(event.target.value)}
              type="date"
              value={newFlightArrivalDate}
            />
          </label>
          <label>
            도착 시간
            <input
              onChange={(event) => onNewFlightArrivalTimeChange(event.target.value)}
              placeholder="예: 12:45"
              type="text"
              value={newFlightArrivalTime}
            />
          </label>
        </div>

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
