import type { FormEvent } from "react";
import type { AuthResponse } from "../../api/auth";
import type { OwnerTrip, SharedFlight, SharedPlace, SharedSchedule } from "../../api/trips";
import type { FlightDirection } from "../../shared/travelOptions";
import type { PlaceCategory, ScheduleItem } from "../../types/travel";

export type AuthMode = "login" | "register";

export type ManageAuthSectionProps = {
  auth: AuthResponse | null;
  authChecked: boolean;
  authEmail: string;
  authError: string;
  authMode: AuthMode;
  authPassword: string;
  authSubmitting: boolean;
  onAuthEmailChange: (value: string) => void;
  onAuthModeChange: (mode: AuthMode) => void;
  onAuthPasswordChange: (value: string) => void;
  onSubmitAuth: (event: FormEvent<HTMLFormElement>) => void;
};

export type ManageSessionActionProps = {
  onLogout: () => void;
};

export type TripCreateSectionProps = {
  newTripEndDate: string;
  newTripMemo: string;
  newTripStartDate: string;
  newTripTitle: string;
  newTripTravelers: string;
  onNewTripEndDateChange: (value: string) => void;
  onNewTripMemoChange: (value: string) => void;
  onNewTripStartDateChange: (value: string) => void;
  onNewTripTitleChange: (value: string) => void;
  onNewTripTravelersChange: (value: string) => void;
  onSubmitNewTrip: (event: FormEvent<HTMLFormElement>) => void;
  tripCreateError: string;
  tripCreateSubmitting: boolean;
};

export type TripListSectionProps = {
  onSelectOwnerTrip: (tripID: string) => void;
  ownerTrips: OwnerTrip[];
  ownerTripsError: string;
  ownerTripsLoading: boolean;
};

export type SelectedTripDetailSectionProps = {
  deletingPlaceID: string;
  deletingScheduleID: string;
  flightCreateError: string;
  flightCreateSubmitting: boolean;
  isPlaceListEditing: boolean;
  isScheduleListEditing: boolean;
  newFlightAirline: string;
  newFlightArrivalAirport: string;
  newFlightArrivalDate: string;
  newFlightArrivalTime: string;
  newFlightDepartureAirport: string;
  newFlightDepartureDate: string;
  newFlightDepartureTime: string;
  newFlightDirection: FlightDirection;
  newFlightLabel: string;
  newFlightMemo: string;
  newFlightNumber: string;
  newPlaceAddress: string;
  newPlaceCategory: PlaceCategory;
  newPlaceGoogleMapsURL: string;
  newPlaceName: string;
  newPlaceRecommendedReason: string;
  newScheduleDate: string;
  newScheduleGuideMemo: string;
  newSchedulePlaceID: string;
  newScheduleTime: string;
  newScheduleTitle: string;
  newScheduleTransportMemo: string;
  newScheduleType: ScheduleItem["type"];
  onCloseOwnerTripDetail: () => void;
  onCopyShareLink: () => void;
  onCreateShareLink: () => void;
  onDeletePlace: (placeID: string) => void;
  onDeleteSchedule: (scheduleID: string) => void;
  onNewFlightAirlineChange: (value: string) => void;
  onNewFlightArrivalAirportChange: (value: string) => void;
  onNewFlightArrivalDateChange: (value: string) => void;
  onNewFlightArrivalTimeChange: (value: string) => void;
  onNewFlightDepartureAirportChange: (value: string) => void;
  onNewFlightDepartureDateChange: (value: string) => void;
  onNewFlightDepartureTimeChange: (value: string) => void;
  onNewFlightDirectionChange: (value: FlightDirection) => void;
  onNewFlightLabelChange: (value: string) => void;
  onNewFlightMemoChange: (value: string) => void;
  onNewFlightNumberChange: (value: string) => void;
  onNewPlaceAddressChange: (value: string) => void;
  onNewPlaceCategoryChange: (value: PlaceCategory) => void;
  onNewPlaceGoogleMapsURLChange: (value: string) => void;
  onNewPlaceNameChange: (value: string) => void;
  onNewPlaceRecommendedReasonChange: (value: string) => void;
  onNewScheduleDateChange: (value: string) => void;
  onNewScheduleGuideMemoChange: (value: string) => void;
  onNewSchedulePlaceIDChange: (value: string) => void;
  onNewScheduleTimeChange: (value: string) => void;
  onNewScheduleTitleChange: (value: string) => void;
  onNewScheduleTransportMemoChange: (value: string) => void;
  onNewScheduleTypeChange: (value: ScheduleItem["type"]) => void;
  onPlaceListEditingChange: (value: boolean) => void;
  onScheduleListEditingChange: (value: boolean) => void;
  onSubmitNewFlight: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitNewPlace: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitNewSchedule: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitTripEdit: (event: FormEvent<HTMLFormElement>) => void;
  onTripEditEndDateChange: (value: string) => void;
  onTripEditMemoChange: (value: string) => void;
  onTripEditStartDateChange: (value: string) => void;
  onTripEditTitleChange: (value: string) => void;
  onTripEditTravelersChange: (value: string) => void;
  ownerDetailDataError: string;
  ownerDetailDataLoading: boolean;
  ownerFlights: SharedFlight[];
  ownerPlaces: SharedPlace[];
  ownerSchedules: SharedSchedule[];
  placeCreateError: string;
  placeCreateSubmitting: boolean;
  placeDeleteError: string;
  scheduleCreateError: string;
  scheduleCreateSubmitting: boolean;
  scheduleDeleteError: string;
  selectedOwnerTrip: OwnerTrip | null;
  selectedShareLink: string;
  shareLinkCopied: boolean;
  shareLinkError: string;
  shareLinkSubmitting: boolean;
  tripEditEndDate: string;
  tripEditError: string;
  tripEditMemo: string;
  tripEditStartDate: string;
  tripEditSubmitting: boolean;
  tripEditTitle: string;
  tripEditTravelers: string;
};

// useTripManageController가 계산한 여행 관리 화면 입력값과 이벤트 핸들러를 섹션별 props로 전달한다.
export type TripManagePageProps = ManageAuthSectionProps &
  ManageSessionActionProps &
  TripCreateSectionProps &
  TripListSectionProps &
  SelectedTripDetailSectionProps;
