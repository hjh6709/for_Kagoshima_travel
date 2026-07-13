import { formatKoreanDate } from "../../../shared/date";
import type { TripManagePageProps } from "../manageTypes";
import { ManageFlightCreateForm } from "./ManageFlightCreateForm";
import { ManageFlightList } from "./ManageFlightList";
import { ManagePlaceCreateForm } from "./ManagePlaceCreateForm";
import { ManagePlaceList } from "./ManagePlaceList";
import { ManageScheduleCreateForm } from "./ManageScheduleCreateForm";
import { ManageScheduleList } from "./ManageScheduleList";
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

        <ManageScheduleCreateForm
          newScheduleDate={newScheduleDate}
          newScheduleGuideMemo={newScheduleGuideMemo}
          newSchedulePlaceID={newSchedulePlaceID}
          newScheduleTime={newScheduleTime}
          newScheduleTitle={newScheduleTitle}
          newScheduleTransportMemo={newScheduleTransportMemo}
          newScheduleType={newScheduleType}
          onNewScheduleDateChange={onNewScheduleDateChange}
          onNewScheduleGuideMemoChange={onNewScheduleGuideMemoChange}
          onNewSchedulePlaceIDChange={onNewSchedulePlaceIDChange}
          onNewScheduleTimeChange={onNewScheduleTimeChange}
          onNewScheduleTitleChange={onNewScheduleTitleChange}
          onNewScheduleTransportMemoChange={onNewScheduleTransportMemoChange}
          onNewScheduleTypeChange={onNewScheduleTypeChange}
          onSubmitNewSchedule={onSubmitNewSchedule}
          ownerPlaces={ownerPlaces}
          scheduleCreateError={scheduleCreateError}
          scheduleCreateSubmitting={scheduleCreateSubmitting}
          tripEndDate={selectedOwnerTrip.endDate}
          tripStartDate={selectedOwnerTrip.startDate}
        />

        <ManageScheduleList
          deletingScheduleID={deletingScheduleID}
          isScheduleListEditing={isScheduleListEditing}
          onDeleteSchedule={onDeleteSchedule}
          onScheduleListEditingChange={onScheduleListEditingChange}
          ownerDetailDataError={ownerDetailDataError}
          ownerDetailDataLoading={ownerDetailDataLoading}
          ownerPlaces={ownerPlaces}
          ownerSchedules={ownerSchedules}
          scheduleDeleteError={scheduleDeleteError}
        />

        <ManagePlaceList
          deletingPlaceID={deletingPlaceID}
          isPlaceListEditing={isPlaceListEditing}
          onDeletePlace={onDeletePlace}
          onPlaceListEditingChange={onPlaceListEditingChange}
          ownerDetailDataError={ownerDetailDataError}
          ownerDetailDataLoading={ownerDetailDataLoading}
          ownerPlaces={ownerPlaces}
          placeDeleteError={placeDeleteError}
        />

        <ManageFlightList
          ownerDetailDataError={ownerDetailDataError}
          ownerDetailDataLoading={ownerDetailDataLoading}
          ownerFlights={ownerFlights}
        />
      </article>
    </section>
  );
}
