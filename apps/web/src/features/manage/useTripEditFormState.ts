import { useState } from "react";

type EditableTrip = {
  title: string;
  startDate: string;
  endDate: string;
  travelers: string[];
  destinationCountry?: string;
  memo?: string;
};

// 선택한 여행의 기본 정보 수정 폼 상태를 모아 관리한다.
export function useTripEditFormState() {
  const [tripEditTitle, setTripEditTitle] = useState("");
  const [tripEditStartDate, setTripEditStartDate] = useState("");
  const [tripEditEndDate, setTripEditEndDate] = useState("");
  const [tripEditTravelers, setTripEditTravelers] = useState("");
  const [tripEditDestinationCountry, setTripEditDestinationCountry] = useState("JP");
  const [tripEditMemo, setTripEditMemo] = useState("");
  const [tripEditError, setTripEditError] = useState("");
  const [tripEditSubmitting, setTripEditSubmitting] = useState(false);

  // 선택 여행이 없을 때 수정 폼에 이전 여행 정보가 남지 않도록 비운다.
  function resetTripEditForm() {
    setTripEditTitle("");
    setTripEditStartDate("");
    setTripEditEndDate("");
    setTripEditTravelers("");
    setTripEditDestinationCountry("JP");
    setTripEditMemo("");
    setTripEditError("");
  }

  // 여행을 선택하면 서버에서 받은 최신 기본 정보를 수정 폼의 초기값으로 채운다.
  function fillTripEditForm(trip: EditableTrip) {
    setTripEditTitle(trip.title);
    setTripEditStartDate(trip.startDate);
    setTripEditEndDate(trip.endDate);
    setTripEditTravelers(trip.travelers.join(", "));
    setTripEditDestinationCountry(trip.destinationCountry ?? "JP");
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
    tripEditDestinationCountry,
    setTripEditDestinationCountry,
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
