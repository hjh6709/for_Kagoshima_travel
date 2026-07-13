import { useEffect } from "react";
import type { TripManagePageProps } from "./manageTypes";
import { useTripManageDetailData } from "./useTripManageDetailData";
import {
  useFlightManageFormState,
  usePlaceManageFormState,
  useScheduleManageFormState,
  useTripCreateFormState,
  useTripEditFormState,
} from "./useTripManageFormState";
import { useTripManageSessionTrips } from "./useTripManageSessionTrips";
import { useTripManageShareLink } from "./useTripManageShareLink";

type UseTripManageControllerParams = {
  currentPath: string;
  isLegacyOwnerRoute: boolean;
  isManageRoute: boolean;
};

// 여행 관리 화면의 인증, 서버 데이터 조회, 생성/삭제 핸들러를 TripManagePage props로 변환한다.
export function useTripManageController({
  currentPath,
  isLegacyOwnerRoute,
  isManageRoute,
}: UseTripManageControllerParams): TripManagePageProps {
  const {
    newTripTitle,
    setNewTripTitle,
    newTripStartDate,
    setNewTripStartDate,
    newTripEndDate,
    setNewTripEndDate,
    newTripTravelers,
    setNewTripTravelers,
    newTripMemo,
    setNewTripMemo,
    tripCreateError,
    setTripCreateError,
    tripCreateSubmitting,
    setTripCreateSubmitting,
    resetTripCreateForm,
  } = useTripCreateFormState();
  const {
    tripEditTitle,
    setTripEditTitle,
    tripEditStartDate,
    setTripEditStartDate,
    tripEditEndDate,
    setTripEditEndDate,
    tripEditTravelers,
    setTripEditTravelers,
    tripEditMemo,
    setTripEditMemo,
    tripEditError,
    setTripEditError,
    tripEditSubmitting,
    setTripEditSubmitting,
    resetTripEditForm,
    fillTripEditForm,
  } = useTripEditFormState();
  const {
    authChecked,
    authEmail,
    authError,
    authMode,
    authPassword,
    authSubmitting,
    changeAuthMode,
    clearOwnerSessionBase,
    ownerAuth,
    ownerTrips,
    ownerTripsError,
    ownerTripsLoading,
    resetSessionMessagesForLogout,
    selectedOwnerTrip,
    setAuthEmail,
    setAuthPassword,
    setSelectedOwnerTripID,
    submitAuth,
    submitNewTrip,
    submitTripEdit,
  } = useTripManageSessionTrips({
    currentPath,
    isLegacyOwnerRoute,
    isManageRoute,
    tripCreateForm: {
      newTripEndDate,
      newTripMemo,
      newTripStartDate,
      newTripTitle,
      newTripTravelers,
      resetTripCreateForm,
      setTripCreateError,
      setTripCreateSubmitting,
    },
    tripEditForm: {
      setTripEditError,
      setTripEditSubmitting,
      tripEditEndDate,
      tripEditMemo,
      tripEditStartDate,
      tripEditTitle,
      tripEditTravelers,
    },
  });
  const {
    newScheduleDate,
    setNewScheduleDate,
    newScheduleTime,
    setNewScheduleTime,
    newScheduleType,
    setNewScheduleType,
    newScheduleTitle,
    setNewScheduleTitle,
    newSchedulePlaceID,
    setNewSchedulePlaceID,
    newScheduleTransportMemo,
    setNewScheduleTransportMemo,
    newScheduleGuideMemo,
    setNewScheduleGuideMemo,
    scheduleCreateError,
    setScheduleCreateError,
    scheduleCreateSubmitting,
    setScheduleCreateSubmitting,
    isScheduleListEditing,
    setIsScheduleListEditing,
    scheduleDeleteError,
    setScheduleDeleteError,
    deletingScheduleID,
    setDeletingScheduleID,
    resetScheduleManageForm,
    prepareScheduleManageForm,
  } = useScheduleManageFormState();
  const {
    newPlaceName,
    setNewPlaceName,
    newPlaceCategory,
    setNewPlaceCategory,
    newPlaceAddress,
    setNewPlaceAddress,
    newPlaceGoogleMapsURL,
    setNewPlaceGoogleMapsURL,
    newPlaceRecommendedReason,
    setNewPlaceRecommendedReason,
    placeCreateError,
    setPlaceCreateError,
    placeCreateSubmitting,
    setPlaceCreateSubmitting,
    isPlaceListEditing,
    setIsPlaceListEditing,
    placeDeleteError,
    setPlaceDeleteError,
    deletingPlaceID,
    setDeletingPlaceID,
    resetPlaceManageForm,
  } = usePlaceManageFormState();
  const {
    newFlightDirection,
    setNewFlightDirection,
    newFlightLabel,
    setNewFlightLabel,
    newFlightAirline,
    setNewFlightAirline,
    newFlightNumber,
    setNewFlightNumber,
    newFlightDepartureAirport,
    setNewFlightDepartureAirport,
    newFlightArrivalAirport,
    setNewFlightArrivalAirport,
    newFlightDepartureDate,
    setNewFlightDepartureDate,
    newFlightDepartureTime,
    setNewFlightDepartureTime,
    newFlightArrivalDate,
    setNewFlightArrivalDate,
    newFlightArrivalTime,
    setNewFlightArrivalTime,
    newFlightMemo,
    setNewFlightMemo,
    flightCreateError,
    setFlightCreateError,
    flightCreateSubmitting,
    setFlightCreateSubmitting,
    resetFlightManageForm,
    prepareFlightManageForm,
  } = useFlightManageFormState();

  // 인증이 만료되었을 때 화면에 남은 소유자 전용 상세 데이터까지 한 번에 비운다.
  function clearOwnerSession() {
    clearOwnerSessionBase();
    clearOwnerDetailData();
  }

  const {
    clearOwnerDetailData,
    deleteOwnerPlace,
    deleteOwnerSchedule,
    ownerDetailDataError,
    ownerDetailDataLoading,
    ownerFlights,
    ownerPlaces,
    ownerSchedules,
    submitNewFlight,
    submitNewPlace,
    submitNewSchedule,
  } = useTripManageDetailData({
    clearOwnerSession,
    ownerAuth,
    selectedOwnerTrip,
    scheduleForm: {
      newScheduleDate,
      newScheduleGuideMemo,
      newSchedulePlaceID,
      newScheduleTime,
      newScheduleTitle,
      newScheduleTransportMemo,
      newScheduleType,
      setDeletingScheduleID,
      setNewScheduleGuideMemo,
      setNewSchedulePlaceID,
      setNewScheduleTime,
      setNewScheduleTitle,
      setNewScheduleTransportMemo,
      setScheduleCreateError,
      setScheduleCreateSubmitting,
      setScheduleDeleteError,
    },
    placeForm: {
      newPlaceAddress,
      newPlaceCategory,
      newPlaceGoogleMapsURL,
      newPlaceName,
      newPlaceRecommendedReason,
      setDeletingPlaceID,
      setNewPlaceAddress,
      setNewPlaceGoogleMapsURL,
      setNewPlaceName,
      setNewPlaceRecommendedReason,
      setNewSchedulePlaceID,
      setPlaceCreateError,
      setPlaceCreateSubmitting,
      setPlaceDeleteError,
    },
    flightForm: {
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
      setFlightCreateError,
      setFlightCreateSubmitting,
      setNewFlightAirline,
      setNewFlightArrivalAirport,
      setNewFlightArrivalTime,
      setNewFlightDepartureAirport,
      setNewFlightDepartureTime,
      setNewFlightLabel,
      setNewFlightMemo,
      setNewFlightNumber,
    },
  });
  const {
    copySelectedTripShareLink,
    createSelectedTripShareLink,
    resetShareLinkState,
    selectedShareLink,
    shareLinkCopied,
    shareLinkError,
    shareLinkSubmitting,
  } = useTripManageShareLink({
    clearOwnerSession,
    ownerAuth,
    selectedOwnerTrip,
  });

  useEffect(() => {
    if (!selectedOwnerTrip) {
      resetTripEditForm();
      resetScheduleManageForm();
      resetPlaceManageForm();
      resetFlightManageForm();
      return;
    }

    fillTripEditForm(selectedOwnerTrip);
    prepareScheduleManageForm(selectedOwnerTrip.startDate);
    resetPlaceManageForm();
    prepareFlightManageForm(selectedOwnerTrip.startDate);
  }, [selectedOwnerTrip]);

  function logoutOwner() {
    clearOwnerSession();
    resetShareLinkState();
    setScheduleCreateSubmitting(false);
    resetScheduleManageForm();
    setPlaceCreateSubmitting(false);
    resetPlaceManageForm();
    setFlightCreateSubmitting(false);
    resetFlightManageForm();
    resetSessionMessagesForLogout();
  }

  return {
    auth: ownerAuth,
    authChecked,
    authEmail,
    authError,
    authMode,
    authPassword,
    authSubmitting,
    ownerTrips,
    ownerTripsError,
    ownerTripsLoading,
    ownerSchedules,
    ownerPlaces,
    ownerFlights,
    ownerDetailDataError,
    ownerDetailDataLoading,
    isScheduleListEditing,
    deletingScheduleID,
    isPlaceListEditing,
    deletingPlaceID,
    selectedOwnerTrip,
    selectedShareLink,
    newTripEndDate,
    newTripMemo,
    newTripStartDate,
    newTripTitle,
    newTripTravelers,
    newScheduleDate,
    newScheduleGuideMemo,
    newSchedulePlaceID,
    newScheduleTime,
    newScheduleTitle,
    newScheduleTransportMemo,
    newScheduleType,
    newPlaceAddress,
    newPlaceCategory,
    newPlaceGoogleMapsURL,
    newPlaceName,
    newPlaceRecommendedReason,
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
    flightCreateError,
    flightCreateSubmitting,
    placeCreateError,
    placeCreateSubmitting,
    placeDeleteError,
    scheduleCreateError,
    scheduleCreateSubmitting,
    scheduleDeleteError,
    shareLinkCopied,
    shareLinkError,
    shareLinkSubmitting,
    tripCreateError,
    tripCreateSubmitting,
    tripEditEndDate,
    tripEditError,
    tripEditMemo,
    tripEditStartDate,
    tripEditSubmitting,
    tripEditTitle,
    tripEditTravelers,
    onAuthEmailChange: setAuthEmail,
    onAuthModeChange: changeAuthMode,
    onAuthPasswordChange: setAuthPassword,
    onNewTripEndDateChange: setNewTripEndDate,
    onNewTripMemoChange: setNewTripMemo,
    onNewTripStartDateChange: (value) => {
      setNewTripStartDate(value);
      if (!newTripEndDate || newTripEndDate < value) {
        setNewTripEndDate(value);
      }
    },
    onNewTripTitleChange: setNewTripTitle,
    onNewTripTravelersChange: setNewTripTravelers,
    onNewScheduleDateChange: setNewScheduleDate,
    onNewScheduleGuideMemoChange: setNewScheduleGuideMemo,
    onNewSchedulePlaceIDChange: setNewSchedulePlaceID,
    onNewScheduleTimeChange: setNewScheduleTime,
    onNewScheduleTitleChange: setNewScheduleTitle,
    onNewScheduleTransportMemoChange: setNewScheduleTransportMemo,
    onNewScheduleTypeChange: setNewScheduleType,
    onNewPlaceAddressChange: setNewPlaceAddress,
    onNewPlaceCategoryChange: setNewPlaceCategory,
    onNewPlaceGoogleMapsURLChange: setNewPlaceGoogleMapsURL,
    onNewPlaceNameChange: setNewPlaceName,
    onNewPlaceRecommendedReasonChange: setNewPlaceRecommendedReason,
    onNewFlightAirlineChange: setNewFlightAirline,
    onNewFlightArrivalAirportChange: setNewFlightArrivalAirport,
    onNewFlightArrivalDateChange: setNewFlightArrivalDate,
    onNewFlightArrivalTimeChange: setNewFlightArrivalTime,
    onNewFlightDepartureAirportChange: setNewFlightDepartureAirport,
    onNewFlightDepartureDateChange: (value) => {
      setNewFlightDepartureDate(value);
      if (!newFlightArrivalDate || newFlightArrivalDate < value) {
        setNewFlightArrivalDate(value);
      }
    },
    onNewFlightDepartureTimeChange: setNewFlightDepartureTime,
    onNewFlightDirectionChange: setNewFlightDirection,
    onNewFlightLabelChange: setNewFlightLabel,
    onNewFlightMemoChange: setNewFlightMemo,
    onNewFlightNumberChange: setNewFlightNumber,
    onCloseOwnerTripDetail: () => setSelectedOwnerTripID(null),
    onCopyShareLink: copySelectedTripShareLink,
    onCreateShareLink: createSelectedTripShareLink,
    onDeleteSchedule: deleteOwnerSchedule,
    onScheduleListEditingChange: setIsScheduleListEditing,
    onDeletePlace: deleteOwnerPlace,
    onPlaceListEditingChange: setIsPlaceListEditing,
    onTripEditEndDateChange: setTripEditEndDate,
    onTripEditMemoChange: setTripEditMemo,
    onTripEditStartDateChange: (value) => {
      setTripEditStartDate(value);
      if (!tripEditEndDate || tripEditEndDate < value) {
        setTripEditEndDate(value);
      }
    },
    onTripEditTitleChange: setTripEditTitle,
    onTripEditTravelersChange: setTripEditTravelers,
    onLogout: logoutOwner,
    onSelectOwnerTrip: setSelectedOwnerTripID,
    onSubmitAuth: submitAuth,
    onSubmitNewPlace: submitNewPlace,
    onSubmitNewFlight: submitNewFlight,
    onSubmitNewTrip: submitNewTrip,
    onSubmitNewSchedule: submitNewSchedule,
    onSubmitTripEdit: submitTripEdit,
  };
}
