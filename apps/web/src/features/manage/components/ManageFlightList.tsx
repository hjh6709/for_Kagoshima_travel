import { Edit3, Save, Trash2, X } from "lucide-react";
import { formatKoreanDate } from "../../../shared/date";
import { flightDirectionOptions, getFlightDirectionLabel, type FlightDirection } from "../../../shared/travelOptions";
import type { TripManagePageProps } from "../manageTypes";

type ManageFlightListProps = Pick<
  TripManagePageProps,
  | "deletingFlightID"
  | "editingFlightAirline"
  | "editingFlightArrivalAirport"
  | "editingFlightArrivalDate"
  | "editingFlightArrivalTime"
  | "editingFlightDepartureAirport"
  | "editingFlightDepartureDate"
  | "editingFlightDepartureTime"
  | "editingFlightDirection"
  | "editingFlightID"
  | "editingFlightLabel"
  | "editingFlightMemo"
  | "editingFlightNumber"
  | "flightDeleteError"
  | "flightEditError"
  | "flightEditSubmitting"
  | "isFlightListEditing"
  | "onCancelFlightEdit"
  | "onDeleteFlight"
  | "onEditingFlightAirlineChange"
  | "onEditingFlightArrivalAirportChange"
  | "onEditingFlightArrivalDateChange"
  | "onEditingFlightArrivalTimeChange"
  | "onEditingFlightDepartureAirportChange"
  | "onEditingFlightDepartureDateChange"
  | "onEditingFlightDepartureTimeChange"
  | "onEditingFlightDirectionChange"
  | "onEditingFlightLabelChange"
  | "onEditingFlightMemoChange"
  | "onEditingFlightNumberChange"
  | "onFlightListEditingChange"
  | "onStartFlightEdit"
  | "onSubmitFlightEdit"
  | "ownerDetailDataError"
  | "ownerDetailDataLoading"
  | "ownerFlights"
  | "selectedOwnerTrip"
>;

// 서버에 저장되어 공유 화면 항공 탭에 표시되는 항공편 목록만 담당한다. 수정/삭제 버튼은 편집 모드에서만 노출한다.
export function ManageFlightList({
  deletingFlightID,
  editingFlightAirline,
  editingFlightArrivalAirport,
  editingFlightArrivalDate,
  editingFlightArrivalTime,
  editingFlightDepartureAirport,
  editingFlightDepartureDate,
  editingFlightDepartureTime,
  editingFlightDirection,
  editingFlightID,
  editingFlightLabel,
  editingFlightMemo,
  editingFlightNumber,
  flightDeleteError,
  flightEditError,
  flightEditSubmitting,
  isFlightListEditing,
  onCancelFlightEdit,
  onDeleteFlight,
  onEditingFlightAirlineChange,
  onEditingFlightArrivalAirportChange,
  onEditingFlightArrivalDateChange,
  onEditingFlightArrivalTimeChange,
  onEditingFlightDepartureAirportChange,
  onEditingFlightDepartureDateChange,
  onEditingFlightDepartureTimeChange,
  onEditingFlightDirectionChange,
  onEditingFlightLabelChange,
  onEditingFlightMemoChange,
  onEditingFlightNumberChange,
  onFlightListEditingChange,
  onStartFlightEdit,
  onSubmitFlightEdit,
  ownerDetailDataError,
  ownerDetailDataLoading,
  ownerFlights,
  selectedOwnerTrip,
}: ManageFlightListProps) {
  return (
    <section className="owner-linked-data-section">
      <div className="section-title-row compact-title-row">
        <div>
          <h3>공유되는 항공편</h3>
          <p className="section-caption">공유 화면 항공 정보에 표시되는 항공편입니다.</p>
        </div>
        <div className="section-actions">
          <span className="pill subtle">{ownerFlights.length}개</span>
          <button
            className="secondary-button compact-button"
            disabled={ownerFlights.length === 0}
            onClick={() => onFlightListEditingChange(!isFlightListEditing)}
            type="button"
          >
            {isFlightListEditing ? "완료" : "편집"}
          </button>
        </div>
      </div>

      {flightDeleteError && <p className="form-error">{flightDeleteError}</p>}

      {!ownerDetailDataLoading && !ownerDetailDataError && ownerFlights.length === 0 && (
        <article className="empty-state-card list-card">
          <p className="muted">아직 서버에 저장된 항공편이 없습니다.</p>
        </article>
      )}

      {!ownerDetailDataLoading && !ownerDetailDataError && ownerFlights.length > 0 && (
        <div className="card-stack compact-card-stack">
          {ownerFlights.map((flight) => (
            <article className="owner-linked-card" key={flight.id}>
              <div>
                <span className="muted-label">
                  {getFlightDirectionLabel(flight.direction)} · {formatKoreanDate(flight.departureDate)}{" "}
                  {flight.departureTime}
                </span>
                <h2>
                  {flight.label}
                  {flight.flightNumber ? ` · ${flight.flightNumber}` : ""}
                </h2>
                <p className="section-caption">
                  {flight.departureAirport} → {flight.arrivalAirport}
                </p>
              </div>
              {isFlightListEditing && (
                <div className="owner-linked-actions">
                  <button className="secondary-button compact-button" onClick={() => onStartFlightEdit(flight)} type="button">
                    <Edit3 size={16} />
                    수정
                  </button>
                  <button
                    className="danger-button compact-button"
                    disabled={deletingFlightID === flight.id}
                    onClick={() => onDeleteFlight(flight.id)}
                    type="button"
                  >
                    <Trash2 size={16} />
                    {deletingFlightID === flight.id ? "삭제 중" : "삭제"}
                  </button>
                </div>
              )}
              {flight.memo && <p className="muted">{flight.memo}</p>}
              {isFlightListEditing && editingFlightID === flight.id && selectedOwnerTrip && (
                <form className="auth-form compact-owner-form owner-inline-edit-form" onSubmit={onSubmitFlightEdit}>
                  <div className="form-grid-two">
                    <label>
                      방향
                      <select
                        onChange={(event) => onEditingFlightDirectionChange(event.target.value as FlightDirection)}
                        value={editingFlightDirection}
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
                        onChange={(event) => onEditingFlightLabelChange(event.target.value)}
                        required
                        type="text"
                        value={editingFlightLabel}
                      />
                    </label>
                  </div>

                  <div className="form-grid-two">
                    <label>
                      항공사
                      <input
                        onChange={(event) => onEditingFlightAirlineChange(event.target.value)}
                        type="text"
                        value={editingFlightAirline}
                      />
                    </label>
                    <label>
                      편명
                      <input
                        onChange={(event) => onEditingFlightNumberChange(event.target.value)}
                        type="text"
                        value={editingFlightNumber}
                      />
                    </label>
                  </div>

                  <div className="form-grid-two">
                    <label>
                      출발 공항
                      <input
                        onChange={(event) => onEditingFlightDepartureAirportChange(event.target.value)}
                        required
                        type="text"
                        value={editingFlightDepartureAirport}
                      />
                    </label>
                    <label>
                      도착 공항
                      <input
                        onChange={(event) => onEditingFlightArrivalAirportChange(event.target.value)}
                        required
                        type="text"
                        value={editingFlightArrivalAirport}
                      />
                    </label>
                  </div>

                  <div className="form-grid-two">
                    <label>
                      출발 날짜
                      <input
                        max={selectedOwnerTrip.endDate}
                        min={selectedOwnerTrip.startDate}
                        onChange={(event) => onEditingFlightDepartureDateChange(event.target.value)}
                        required
                        type="date"
                        value={editingFlightDepartureDate}
                      />
                    </label>
                    <label>
                      출발 시간
                      <input
                        onChange={(event) => onEditingFlightDepartureTimeChange(event.target.value)}
                        required
                        type="text"
                        value={editingFlightDepartureTime}
                      />
                    </label>
                  </div>

                  <div className="form-grid-two">
                    <label>
                      도착 날짜
                      <input
                        max={selectedOwnerTrip.endDate}
                        min={editingFlightDepartureDate || selectedOwnerTrip.startDate}
                        onChange={(event) => onEditingFlightArrivalDateChange(event.target.value)}
                        type="date"
                        value={editingFlightArrivalDate}
                      />
                    </label>
                    <label>
                      도착 시간
                      <input
                        onChange={(event) => onEditingFlightArrivalTimeChange(event.target.value)}
                        type="text"
                        value={editingFlightArrivalTime}
                      />
                    </label>
                  </div>

                  <label>
                    항공 메모
                    <textarea
                      onChange={(event) => onEditingFlightMemoChange(event.target.value)}
                      rows={2}
                      value={editingFlightMemo}
                    />
                  </label>

                  {flightEditError && <p className="form-error">{flightEditError}</p>}

                  <div className="owner-linked-actions">
                    <button className="primary-button compact-button" disabled={flightEditSubmitting} type="submit">
                      <Save size={16} />
                      {flightEditSubmitting ? "저장 중" : "수정 저장"}
                    </button>
                    <button
                      className="secondary-button compact-button"
                      disabled={flightEditSubmitting}
                      onClick={onCancelFlightEdit}
                      type="button"
                    >
                      <X size={16} />
                      취소
                    </button>
                  </div>
                </form>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
