import { ExternalLink, PlusCircle, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { formatKoreanDate } from "../../../shared/date";
import { getFlightDirectionLabel, getScheduleTypeLabel, scheduleTypeOptions } from "../../../shared/travelOptions";
import type { ScheduleItem } from "../../../types/travel";
import type { TripManagePageProps } from "../manageTypes";
import { ManageFlightCreateForm } from "./ManageFlightCreateForm";
import { ManagePlaceCreateForm } from "./ManagePlaceCreateForm";
import { ManageShareActions } from "./ManageShareActions";
import { TripBasicInfoForm } from "./TripBasicInfoForm";

type SelectedTripDetailSectionProps = Pick<
  TripManagePageProps,
  | "deletingPlaceID"
  | "deletingScheduleID"
  | "flightCreateError"
  | "flightCreateSubmitting"
  | "isPlaceListEditing"
  | "isScheduleListEditing"
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
  | "newPlaceAddress"
  | "newPlaceCategory"
  | "newPlaceGoogleMapsURL"
  | "newPlaceName"
  | "newPlaceRecommendedReason"
  | "newScheduleDate"
  | "newScheduleGuideMemo"
  | "newSchedulePlaceID"
  | "newScheduleTime"
  | "newScheduleTitle"
  | "newScheduleTransportMemo"
  | "newScheduleType"
  | "onCloseOwnerTripDetail"
  | "onCopyShareLink"
  | "onCreateShareLink"
  | "onDeletePlace"
  | "onDeleteSchedule"
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
  | "onNewPlaceAddressChange"
  | "onNewPlaceCategoryChange"
  | "onNewPlaceGoogleMapsURLChange"
  | "onNewPlaceNameChange"
  | "onNewPlaceRecommendedReasonChange"
  | "onNewScheduleDateChange"
  | "onNewScheduleGuideMemoChange"
  | "onNewSchedulePlaceIDChange"
  | "onNewScheduleTimeChange"
  | "onNewScheduleTitleChange"
  | "onNewScheduleTransportMemoChange"
  | "onNewScheduleTypeChange"
  | "onPlaceListEditingChange"
  | "onScheduleListEditingChange"
  | "onSubmitNewFlight"
  | "onSubmitNewPlace"
  | "onSubmitNewSchedule"
  | "onSubmitTripEdit"
  | "onTripEditEndDateChange"
  | "onTripEditMemoChange"
  | "onTripEditStartDateChange"
  | "onTripEditTitleChange"
  | "onTripEditTravelersChange"
  | "ownerDetailDataError"
  | "ownerDetailDataLoading"
  | "ownerFlights"
  | "ownerPlaces"
  | "ownerSchedules"
  | "placeCreateError"
  | "placeCreateSubmitting"
  | "placeDeleteError"
  | "scheduleCreateError"
  | "scheduleCreateSubmitting"
  | "scheduleDeleteError"
  | "selectedOwnerTrip"
  | "selectedShareLink"
  | "shareLinkCopied"
  | "shareLinkError"
  | "shareLinkSubmitting"
  | "tripEditEndDate"
  | "tripEditError"
  | "tripEditMemo"
  | "tripEditStartDate"
  | "tripEditSubmitting"
  | "tripEditTitle"
  | "tripEditTravelers"
>;

// 선택한 여행의 상세 관리 화면만 담당한다. 실제 저장/삭제 동작은 상위에서 받은 콜백으로 처리한다.
export function SelectedTripDetailSection(props: SelectedTripDetailSectionProps) {
  const {
    deletingPlaceID,
      deletingScheduleID,
      flightCreateError,
      flightCreateSubmitting,
      isPlaceListEditing,
      isScheduleListEditing,
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
      newPlaceAddress,
      newPlaceCategory,
      newPlaceGoogleMapsURL,
      newPlaceName,
      newPlaceRecommendedReason,
      newScheduleDate,
      newScheduleGuideMemo,
      newSchedulePlaceID,
      newScheduleTime,
      newScheduleTitle,
      newScheduleTransportMemo,
      newScheduleType,
      onCloseOwnerTripDetail,
      onCopyShareLink,
      onCreateShareLink,
      onDeletePlace,
      onDeleteSchedule,
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
      onNewPlaceAddressChange,
      onNewPlaceCategoryChange,
      onNewPlaceGoogleMapsURLChange,
      onNewPlaceNameChange,
      onNewPlaceRecommendedReasonChange,
      onNewScheduleDateChange,
      onNewScheduleGuideMemoChange,
      onNewSchedulePlaceIDChange,
      onNewScheduleTimeChange,
      onNewScheduleTitleChange,
      onNewScheduleTransportMemoChange,
      onNewScheduleTypeChange,
      onPlaceListEditingChange,
      onScheduleListEditingChange,
      onSubmitNewFlight,
      onSubmitNewPlace,
      onSubmitNewSchedule,
      onSubmitTripEdit,
      onTripEditEndDateChange,
      onTripEditMemoChange,
      onTripEditStartDateChange,
      onTripEditTitleChange,
      onTripEditTravelersChange,
      ownerDetailDataError,
      ownerDetailDataLoading,
      ownerFlights,
      ownerPlaces,
      ownerSchedules,
      placeCreateError,
      placeCreateSubmitting,
      placeDeleteError,
      scheduleCreateError,
      scheduleCreateSubmitting,
      scheduleDeleteError,
      selectedOwnerTrip,
      selectedShareLink,
      shareLinkCopied,
      shareLinkError,
      shareLinkSubmitting,
      tripEditEndDate,
      tripEditError,
      tripEditMemo,
      tripEditStartDate,
      tripEditSubmitting,
      tripEditTitle,
      tripEditTravelers,
  } = props;

  const ownerPlaceByID = useMemo(() => new Map(ownerPlaces.map((place) => [place.id, place])), [ownerPlaces]);

  if (!selectedOwnerTrip) {
    return null;
  }

  return (
    <section className="section-block owner-detail-section">
      <div className="section-title-row">
        <div>
          <span className="pill">선택한 여행</span>
          <h2>{selectedOwnerTrip.title}</h2>
          <p className="section-caption">
            {formatKoreanDate(selectedOwnerTrip.startDate)} ~ {formatKoreanDate(selectedOwnerTrip.endDate)}
          </p>
        </div>
        <button className="secondary-button compact-button" onClick={onCloseOwnerTripDetail} type="button">
          목록으로
        </button>
      </div>

      <article className="owner-trip-detail-card">
        <div className="detail-grid">
          <div>
            <span className="muted-label">여행자</span>
            <p>
              {selectedOwnerTrip.travelers.length > 0
                ? selectedOwnerTrip.travelers.join(", ")
                : "여행자 미입력"}
            </p>
          </div>
          <div>
            <span className="muted-label">메모</span>
            <p>{selectedOwnerTrip.memo || "메모 없음"}</p>
          </div>
        </div>

        <TripBasicInfoForm
          onSubmitTripEdit={onSubmitTripEdit}
          onTripEditEndDateChange={onTripEditEndDateChange}
          onTripEditMemoChange={onTripEditMemoChange}
          onTripEditStartDateChange={onTripEditStartDateChange}
          onTripEditTitleChange={onTripEditTitleChange}
          onTripEditTravelersChange={onTripEditTravelersChange}
          tripEditEndDate={tripEditEndDate}
          tripEditError={tripEditError}
          tripEditMemo={tripEditMemo}
          tripEditStartDate={tripEditStartDate}
          tripEditSubmitting={tripEditSubmitting}
          tripEditTitle={tripEditTitle}
          tripEditTravelers={tripEditTravelers}
        />

        <ManageShareActions
          onCopyShareLink={onCopyShareLink}
          onCreateShareLink={onCreateShareLink}
          selectedShareLink={selectedShareLink}
          shareLinkCopied={shareLinkCopied}
          shareLinkError={shareLinkError}
          shareLinkSubmitting={shareLinkSubmitting}
        />

        <ManagePlaceCreateForm
          newPlaceAddress={newPlaceAddress}
          newPlaceCategory={newPlaceCategory}
          newPlaceGoogleMapsURL={newPlaceGoogleMapsURL}
          newPlaceName={newPlaceName}
          newPlaceRecommendedReason={newPlaceRecommendedReason}
          onNewPlaceAddressChange={onNewPlaceAddressChange}
          onNewPlaceCategoryChange={onNewPlaceCategoryChange}
          onNewPlaceGoogleMapsURLChange={onNewPlaceGoogleMapsURLChange}
          onNewPlaceNameChange={onNewPlaceNameChange}
          onNewPlaceRecommendedReasonChange={onNewPlaceRecommendedReasonChange}
          onSubmitNewPlace={onSubmitNewPlace}
          placeCreateError={placeCreateError}
          placeCreateSubmitting={placeCreateSubmitting}
        />

        <ManageFlightCreateForm
          flightCreateError={flightCreateError}
          flightCreateSubmitting={flightCreateSubmitting}
          newFlightAirline={newFlightAirline}
          newFlightArrivalAirport={newFlightArrivalAirport}
          newFlightArrivalDate={newFlightArrivalDate}
          newFlightArrivalTime={newFlightArrivalTime}
          newFlightDepartureAirport={newFlightDepartureAirport}
          newFlightDepartureDate={newFlightDepartureDate}
          newFlightDepartureTime={newFlightDepartureTime}
          newFlightDirection={newFlightDirection}
          newFlightLabel={newFlightLabel}
          newFlightMemo={newFlightMemo}
          newFlightNumber={newFlightNumber}
          onNewFlightAirlineChange={onNewFlightAirlineChange}
          onNewFlightArrivalAirportChange={onNewFlightArrivalAirportChange}
          onNewFlightArrivalDateChange={onNewFlightArrivalDateChange}
          onNewFlightArrivalTimeChange={onNewFlightArrivalTimeChange}
          onNewFlightDepartureAirportChange={onNewFlightDepartureAirportChange}
          onNewFlightDepartureDateChange={onNewFlightDepartureDateChange}
          onNewFlightDepartureTimeChange={onNewFlightDepartureTimeChange}
          onNewFlightDirectionChange={onNewFlightDirectionChange}
          onNewFlightLabelChange={onNewFlightLabelChange}
          onNewFlightMemoChange={onNewFlightMemoChange}
          onNewFlightNumberChange={onNewFlightNumberChange}
          onSubmitNewFlight={onSubmitNewFlight}
          tripEndDate={selectedOwnerTrip.endDate}
          tripStartDate={selectedOwnerTrip.startDate}
        />

        <section className="owner-linked-data-section">
          <div className="section-title-row compact-title-row">
            <div>
              <h3>일정 추가</h3>
              <p className="section-caption">공유 화면에 표시할 일정을 서버에 저장합니다.</p>
            </div>
          </div>

          <form className="auth-form compact-owner-form" onSubmit={onSubmitNewSchedule}>
            <div className="form-grid-two">
              <label>
                날짜
                <input
                  max={selectedOwnerTrip.endDate}
                  min={selectedOwnerTrip.startDate}
                  onChange={(event) => onNewScheduleDateChange(event.target.value)}
                  required
                  type="date"
                  value={newScheduleDate}
                />
              </label>
              <label>
                시간
                <input
                  onChange={(event) => onNewScheduleTimeChange(event.target.value)}
                  placeholder="예: 10:30"
                  required
                  type="text"
                  value={newScheduleTime}
                />
              </label>
            </div>

            <div className="form-grid-two">
              <label>
                유형
                <select
                  onChange={(event) =>
                    onNewScheduleTypeChange(event.target.value as ScheduleItem["type"])
                  }
                  value={newScheduleType}
                >
                  {scheduleTypeOptions.map(([type, label]) => (
                    <option key={type} value={type}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                연결 장소
                <select
                  onChange={(event) => onNewSchedulePlaceIDChange(event.target.value)}
                  value={newSchedulePlaceID}
                >
                  <option value="">장소 연결 안 함</option>
                  {ownerPlaces.map((place) => (
                    <option key={place.id} value={place.id}>
                      {place.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label>
              일정 제목
              <input
                onChange={(event) => onNewScheduleTitleChange(event.target.value)}
                placeholder="예: 공항 도착 후 렌터카 수령"
                required
                type="text"
                value={newScheduleTitle}
              />
            </label>

            <label>
              이동 메모
              <textarea
                onChange={(event) => onNewScheduleTransportMemoChange(event.target.value)}
                placeholder="예: 택시, 버스, 도보 이동 정보"
                rows={2}
                value={newScheduleTransportMemo}
              />
            </label>

            <label>
              안내 메모
              <textarea
                onChange={(event) => onNewScheduleGuideMemoChange(event.target.value)}
                placeholder="예: 준비물, 현장 주의사항, 가족에게 보여줄 설명"
                rows={2}
                value={newScheduleGuideMemo}
              />
            </label>

            {scheduleCreateError && <p className="form-error">{scheduleCreateError}</p>}

            <button className="primary-button" disabled={scheduleCreateSubmitting} type="submit">
              <PlusCircle size={18} />
              {scheduleCreateSubmitting ? "일정 추가 중" : "일정 추가"}
            </button>
          </form>
        </section>

        <section className="owner-linked-data-section">
          <div className="section-title-row compact-title-row">
            <div>
              <h3>공유되는 일정</h3>
              <p className="section-caption">현재 서버에 저장되어 공유 화면에 표시되는 일정입니다.</p>
            </div>
            <div className="section-actions">
              <span className="pill subtle">{ownerSchedules.length}개</span>
              <button
                className="secondary-button compact-button"
                disabled={ownerSchedules.length === 0}
                onClick={() => onScheduleListEditingChange(!isScheduleListEditing)}
                type="button"
              >
                {isScheduleListEditing ? "완료" : "편집"}
              </button>
            </div>
          </div>

          {ownerDetailDataLoading && <p className="muted">일정과 장소를 불러오는 중입니다.</p>}
          {ownerDetailDataError && <p className="form-error">{ownerDetailDataError}</p>}
          {scheduleDeleteError && <p className="form-error">{scheduleDeleteError}</p>}

          {!ownerDetailDataLoading && !ownerDetailDataError && ownerSchedules.length === 0 && (
            <article className="empty-state-card list-card">
              <p className="muted">아직 서버에 저장된 일정이 없습니다.</p>
            </article>
          )}

          {!ownerDetailDataLoading && !ownerDetailDataError && ownerSchedules.length > 0 && (
            <div className="card-stack compact-card-stack">
              {ownerSchedules.map((schedule) => {
                const place = ownerPlaceByID.get(schedule.placeId ?? "");
                return (
                  <article className="owner-linked-card" key={schedule.id}>
                    <div>
                      <span className="muted-label">
                        {formatKoreanDate(schedule.date)} · {schedule.time || "시간 미정"}
                      </span>
                      <h2>{schedule.title}</h2>
                      <p className="section-caption">
                        {getScheduleTypeLabel(schedule.type)}
                        {place ? ` · ${place.name}` : ""}
                      </p>
                    </div>
                    {schedule.guideMemo && <p className="muted">{schedule.guideMemo}</p>}
                    {isScheduleListEditing && (
                      <div className="owner-linked-actions">
                        <button
                          className="danger-button compact-button"
                          disabled={deletingScheduleID === schedule.id}
                          onClick={() => onDeleteSchedule(schedule.id)}
                          type="button"
                        >
                          <Trash2 size={16} />
                          {deletingScheduleID === schedule.id ? "삭제 중" : "삭제"}
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="owner-linked-data-section">
          <div className="section-title-row compact-title-row">
            <div>
              <h3>공유되는 장소</h3>
              <p className="section-caption">일정에서 참조하거나 공유 화면에 표시되는 장소입니다.</p>
            </div>
            <div className="section-actions">
              <span className="pill subtle">{ownerPlaces.length}개</span>
              <button
                className="secondary-button compact-button"
                disabled={ownerPlaces.length === 0}
                onClick={() => onPlaceListEditingChange(!isPlaceListEditing)}
                type="button"
              >
                {isPlaceListEditing ? "완료" : "편집"}
              </button>
            </div>
          </div>

          {placeDeleteError && <p className="form-error">{placeDeleteError}</p>}

          {!ownerDetailDataLoading && !ownerDetailDataError && ownerPlaces.length === 0 && (
            <article className="empty-state-card list-card">
              <p className="muted">아직 서버에 저장된 장소가 없습니다.</p>
            </article>
          )}

          {!ownerDetailDataLoading && !ownerDetailDataError && ownerPlaces.length > 0 && (
            <div className="card-stack compact-card-stack">
              {ownerPlaces.map((place) => (
                <article className="owner-linked-card" key={place.id}>
                  <div>
                    <span className="muted-label">{place.category}</span>
                    <h2>{place.name}</h2>
                    {place.address && <p className="section-caption">{place.address}</p>}
                  </div>
                  <div className="owner-linked-actions">
                    {place.googleMapsUrl && (
                      <a
                        className="secondary-button compact-button"
                        href={place.googleMapsUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <ExternalLink size={16} />
                        지도 열기
                      </a>
                    )}
                    {isPlaceListEditing && (
                      <button
                        className="danger-button compact-button"
                        disabled={deletingPlaceID === place.id}
                        onClick={() => onDeletePlace(place.id)}
                        type="button"
                      >
                        <Trash2 size={16} />
                        {deletingPlaceID === place.id ? "삭제 중" : "삭제"}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="owner-linked-data-section">
          <div className="section-title-row compact-title-row">
            <div>
              <h3>공유되는 항공편</h3>
              <p className="section-caption">공유 화면 항공 정보에 표시되는 항공편입니다.</p>
            </div>
            <span className="pill subtle">{ownerFlights.length}개</span>
          </div>

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
                      {getFlightDirectionLabel(flight.direction)} ·{" "}
                      {formatKoreanDate(flight.departureDate)} {flight.departureTime}
                    </span>
                    <h2>
                      {flight.label}
                      {flight.flightNumber ? ` · ${flight.flightNumber}` : ""}
                    </h2>
                    <p className="section-caption">
                      {flight.departureAirport} → {flight.arrivalAirport}
                    </p>
                  </div>
                  {flight.memo && <p className="muted">{flight.memo}</p>}
                </article>
              ))}
            </div>
          )}
        </section>
      </article>
    </section>
  );
}
