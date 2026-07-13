import { useState } from "react";

type EditableTrip = {
  title: string;
  startDate: string;
  endDate: string;
  travelers: string[];
  memo?: string;
};

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
