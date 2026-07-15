import type { FormEvent } from "react";
import type { AuthResponse } from "../../api/auth";
import type { OwnerTrip, SharedFlight, SharedPlace, SharedSchedule } from "../../api/trips";
import type { FlightDirection } from "../../shared/travelOptions";
import type { PlaceCategory, ScheduleItem } from "../../types/travel";

export type AuthMode = "login" | "register";

// 화면 섹션이 실제로 사용하는 props 묶음이다.
// 새 섹션을 추가할 때는 TripManagePage 전체를 넘기기보다 여기처럼 필요한 경계를 먼저 정의한다.
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
  newTripDestinationCountry: string;
  onNewTripEndDateChange: (value: string) => void;
  onNewTripMemoChange: (value: string) => void;
  onNewTripStartDateChange: (value: string) => void;
  onNewTripTitleChange: (value: string) => void;
  onNewTripTravelersChange: (value: string) => void;
  onNewTripDestinationCountryChange: (value: string) => void;
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

// 선택 여행 상세 화면은 일정/장소/항공/공유/기본정보 섹션을 다시 감싸는 상위 섹션이다.
// 하위 컴포넌트 props를 이 타입으로 모아 두면 controller의 반환 구조와 화면 연결 지점을 한곳에서 추적할 수 있다.
export type SelectedTripDetailSectionProps = {
  deletingPlaceID: string;
  deletingFlightID: string;
  deletingScheduleID: string;
  editingFlightAirline: string;
  editingFlightArrivalAirport: string;
  editingFlightArrivalDate: string;
  editingFlightArrivalTime: string;
  editingFlightDepartureAirport: string;
  editingFlightDepartureDate: string;
  editingFlightDepartureTime: string;
  editingFlightDirection: FlightDirection;
  editingFlightID: string;
  editingFlightLabel: string;
  editingFlightMemo: string;
  editingFlightNumber: string;
  editingPlaceAddress: string;
  editingPlaceCategory: PlaceCategory;
  editingPlaceGoogleMapsURL: string;
  editingPlaceID: string;
  editingPlaceName: string;
  editingPlaceRecommendedReason: string;
  editingScheduleDate: string;
  editingScheduleGuideMemo: string;
  editingScheduleID: string;
  editingSchedulePlaceID: string;
  editingScheduleTime: string;
  editingScheduleTitle: string;
  editingScheduleTransportMemo: string;
  editingScheduleType: ScheduleItem["type"];
  flightCreateError: string;
  flightCreateSubmitting: boolean;
  flightDeleteError: string;
  flightEditError: string;
  flightEditSubmitting: boolean;
  isFlightListEditing: boolean;
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
  onCancelPlaceEdit: () => void;
  onCancelFlightEdit: () => void;
  onCancelScheduleEdit: () => void;
  onCloseOwnerTripDetail: () => void;
  onCopyShareLink: () => void;
  onCreateShareLink: () => void;
  onDeletePlace: (placeID: string) => void;
  onDeleteFlight: (flightID: string) => void;
  onDeleteSchedule: (scheduleID: string) => void;
  onEditingFlightAirlineChange: (value: string) => void;
  onEditingFlightArrivalAirportChange: (value: string) => void;
  onEditingFlightArrivalDateChange: (value: string) => void;
  onEditingFlightArrivalTimeChange: (value: string) => void;
  onEditingFlightDepartureAirportChange: (value: string) => void;
  onEditingFlightDepartureDateChange: (value: string) => void;
  onEditingFlightDepartureTimeChange: (value: string) => void;
  onEditingFlightDirectionChange: (value: FlightDirection) => void;
  onEditingFlightLabelChange: (value: string) => void;
  onEditingFlightMemoChange: (value: string) => void;
  onEditingFlightNumberChange: (value: string) => void;
  onEditingPlaceAddressChange: (value: string) => void;
  onEditingPlaceCategoryChange: (value: PlaceCategory) => void;
  onEditingPlaceGoogleMapsURLChange: (value: string) => void;
  onEditingPlaceNameChange: (value: string) => void;
  onEditingPlaceRecommendedReasonChange: (value: string) => void;
  onEditingScheduleDateChange: (value: string) => void;
  onEditingScheduleGuideMemoChange: (value: string) => void;
  onEditingSchedulePlaceIDChange: (value: string) => void;
  onEditingScheduleTimeChange: (value: string) => void;
  onEditingScheduleTitleChange: (value: string) => void;
  onEditingScheduleTransportMemoChange: (value: string) => void;
  onEditingScheduleTypeChange: (value: ScheduleItem["type"]) => void;
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
  onFlightListEditingChange: (value: boolean) => void;
  onScheduleListEditingChange: (value: boolean) => void;
  onStartFlightEdit: (flight: SharedFlight) => void;
  onStartPlaceEdit: (place: SharedPlace) => void;
  onStartScheduleEdit: (schedule: SharedSchedule) => void;
  onSubmitNewFlight: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitNewPlace: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitNewSchedule: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitPlaceEdit: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitFlightEdit: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitScheduleEdit: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitTripEdit: (event: FormEvent<HTMLFormElement>) => void;
  onTripEditEndDateChange: (value: string) => void;
  onTripEditMemoChange: (value: string) => void;
  onTripEditStartDateChange: (value: string) => void;
  onTripEditTitleChange: (value: string) => void;
  onTripEditTravelersChange: (value: string) => void;
  onTripEditDestinationCountryChange: (value: string) => void;
  ownerDetailDataError: string;
  ownerDetailDataLoading: boolean;
  ownerFlights: SharedFlight[];
  ownerPlaces: SharedPlace[];
  ownerSchedules: SharedSchedule[];
  placeCreateError: string;
  placeCreateSubmitting: boolean;
  placeDeleteError: string;
  placeEditError: string;
  placeEditSubmitting: boolean;
  scheduleCreateError: string;
  scheduleCreateSubmitting: boolean;
  scheduleDeleteError: string;
  scheduleEditError: string;
  scheduleEditSubmitting: boolean;
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
	tripEditDestinationCountry: string;

	// 체크리스트 고도화 필드
	checklistItems: any[];
	checklistLoading: boolean;
	checklistError: string;
	newChecklistTitle: string;
	onNewChecklistTitleChange: (value: string) => void;
	newChecklistCategory: "before" | "airport" | "daily" | "return";
	onNewChecklistCategoryChange: (value: "before" | "airport" | "daily" | "return") => void;
	checklistSubmitting: boolean;
	onAddChecklistItem: (e: React.FormEvent) => void;
	onToggleChecklistItem: (itemID: string, isCompleted: boolean) => void;
	onDeleteChecklistItem: (itemID: string) => void;
};

// useTripManageController가 계산한 여행 관리 화면 입력값과 이벤트 핸들러를 섹션별 props로 전달한다.
export type TripManagePageProps = ManageAuthSectionProps &
  ManageSessionActionProps &
  TripCreateSectionProps &
  TripListSectionProps &
  SelectedTripDetailSectionProps;
