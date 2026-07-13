import { useState } from "react";
import type { FlightDirection } from "../../shared/travelOptions";
import type { PlaceCategory, ScheduleItem } from "../../types/travel";

type EditableTrip = {
  title: string;
  startDate: string;
  endDate: string;
  travelers: string[];
  memo?: string;
};

// 여행 생성 폼의 입력값과 제출 상태를 모아 관리한다.
export function useTripCreateFormState() {
  const [newTripTitle, setNewTripTitle] = useState("");
  const [newTripStartDate, setNewTripStartDate] = useState("");
  const [newTripEndDate, setNewTripEndDate] = useState("");
  const [newTripTravelers, setNewTripTravelers] = useState("");
  const [newTripMemo, setNewTripMemo] = useState("");
  const [tripCreateError, setTripCreateError] = useState("");
  const [tripCreateSubmitting, setTripCreateSubmitting] = useState(false);

  function resetTripCreateForm() {
    setNewTripTitle("");
    setNewTripStartDate("");
    setNewTripEndDate("");
    setNewTripTravelers("");
    setNewTripMemo("");
  }

  return {
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
  };
}

// 선택한 여행의 기본 정보 수정 폼 상태를 모아 관리한다.
export function useTripEditFormState() {
  const [tripEditTitle, setTripEditTitle] = useState("");
  const [tripEditStartDate, setTripEditStartDate] = useState("");
  const [tripEditEndDate, setTripEditEndDate] = useState("");
  const [tripEditTravelers, setTripEditTravelers] = useState("");
  const [tripEditMemo, setTripEditMemo] = useState("");
  const [tripEditError, setTripEditError] = useState("");
  const [tripEditSubmitting, setTripEditSubmitting] = useState(false);

  function resetTripEditForm() {
    setTripEditTitle("");
    setTripEditStartDate("");
    setTripEditEndDate("");
    setTripEditTravelers("");
    setTripEditMemo("");
    setTripEditError("");
  }

  function fillTripEditForm(trip: EditableTrip) {
    setTripEditTitle(trip.title);
    setTripEditStartDate(trip.startDate);
    setTripEditEndDate(trip.endDate);
    setTripEditTravelers(trip.travelers.join(", "));
    setTripEditMemo(trip.memo ?? "");
    setTripEditError("");
  }

  return {
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
  };
}

// 일정 추가 폼과 일정 목록 편집 상태를 모아 관리한다.
export function useScheduleManageFormState() {
  const [newScheduleDate, setNewScheduleDate] = useState("");
  const [newScheduleTime, setNewScheduleTime] = useState("");
  const [newScheduleType, setNewScheduleType] = useState<ScheduleItem["type"]>("sightseeing");
  const [newScheduleTitle, setNewScheduleTitle] = useState("");
  const [newSchedulePlaceID, setNewSchedulePlaceID] = useState("");
  const [newScheduleTransportMemo, setNewScheduleTransportMemo] = useState("");
  const [newScheduleGuideMemo, setNewScheduleGuideMemo] = useState("");
  const [scheduleCreateError, setScheduleCreateError] = useState("");
  const [scheduleCreateSubmitting, setScheduleCreateSubmitting] = useState(false);
  const [isScheduleListEditing, setIsScheduleListEditing] = useState(false);
  const [scheduleDeleteError, setScheduleDeleteError] = useState("");
  const [deletingScheduleID, setDeletingScheduleID] = useState("");

  function resetScheduleManageForm() {
    setNewScheduleDate("");
    setNewScheduleTime("");
    setNewScheduleType("sightseeing");
    setNewScheduleTitle("");
    setNewSchedulePlaceID("");
    setNewScheduleTransportMemo("");
    setNewScheduleGuideMemo("");
    setScheduleCreateError("");
    setIsScheduleListEditing(false);
    setScheduleDeleteError("");
    setDeletingScheduleID("");
  }

  function prepareScheduleManageForm(startDate: string) {
    setNewScheduleDate(startDate);
    setNewScheduleTime("");
    setNewScheduleType("sightseeing");
    setNewScheduleTitle("");
    setNewSchedulePlaceID("");
    setNewScheduleTransportMemo("");
    setNewScheduleGuideMemo("");
    setScheduleCreateError("");
    setIsScheduleListEditing(false);
    setScheduleDeleteError("");
    setDeletingScheduleID("");
  }

  return {
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
  };
}

// 장소 추가 폼과 장소 목록 편집 상태를 모아 관리한다.
export function usePlaceManageFormState() {
  const [newPlaceName, setNewPlaceName] = useState("");
  const [newPlaceCategory, setNewPlaceCategory] = useState<PlaceCategory>("sightseeing");
  const [newPlaceAddress, setNewPlaceAddress] = useState("");
  const [newPlaceGoogleMapsURL, setNewPlaceGoogleMapsURL] = useState("");
  const [newPlaceRecommendedReason, setNewPlaceRecommendedReason] = useState("");
  const [placeCreateError, setPlaceCreateError] = useState("");
  const [placeCreateSubmitting, setPlaceCreateSubmitting] = useState(false);
  const [isPlaceListEditing, setIsPlaceListEditing] = useState(false);
  const [placeDeleteError, setPlaceDeleteError] = useState("");
  const [deletingPlaceID, setDeletingPlaceID] = useState("");

  function resetPlaceManageForm() {
    setNewPlaceName("");
    setNewPlaceCategory("sightseeing");
    setNewPlaceAddress("");
    setNewPlaceGoogleMapsURL("");
    setNewPlaceRecommendedReason("");
    setPlaceCreateError("");
    setIsPlaceListEditing(false);
    setPlaceDeleteError("");
    setDeletingPlaceID("");
  }

  return {
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
  };
}

// 항공편 추가 폼 상태를 모아 관리한다.
export function useFlightManageFormState() {
  const [newFlightDirection, setNewFlightDirection] = useState<FlightDirection>("departure");
  const [newFlightLabel, setNewFlightLabel] = useState("");
  const [newFlightAirline, setNewFlightAirline] = useState("");
  const [newFlightNumber, setNewFlightNumber] = useState("");
  const [newFlightDepartureAirport, setNewFlightDepartureAirport] = useState("");
  const [newFlightArrivalAirport, setNewFlightArrivalAirport] = useState("");
  const [newFlightDepartureDate, setNewFlightDepartureDate] = useState("");
  const [newFlightDepartureTime, setNewFlightDepartureTime] = useState("");
  const [newFlightArrivalDate, setNewFlightArrivalDate] = useState("");
  const [newFlightArrivalTime, setNewFlightArrivalTime] = useState("");
  const [newFlightMemo, setNewFlightMemo] = useState("");
  const [flightCreateError, setFlightCreateError] = useState("");
  const [flightCreateSubmitting, setFlightCreateSubmitting] = useState(false);

  function resetFlightManageForm() {
    setNewFlightDirection("departure");
    setNewFlightLabel("");
    setNewFlightAirline("");
    setNewFlightNumber("");
    setNewFlightDepartureAirport("");
    setNewFlightArrivalAirport("");
    setNewFlightDepartureDate("");
    setNewFlightDepartureTime("");
    setNewFlightArrivalDate("");
    setNewFlightArrivalTime("");
    setNewFlightMemo("");
    setFlightCreateError("");
  }

  function prepareFlightManageForm(startDate: string) {
    setNewFlightDirection("departure");
    setNewFlightLabel("");
    setNewFlightAirline("");
    setNewFlightNumber("");
    setNewFlightDepartureAirport("");
    setNewFlightArrivalAirport("");
    setNewFlightDepartureDate(startDate);
    setNewFlightDepartureTime("");
    setNewFlightArrivalDate(startDate);
    setNewFlightArrivalTime("");
    setNewFlightMemo("");
    setFlightCreateError("");
  }

  return {
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
  };
}
