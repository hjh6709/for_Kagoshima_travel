import { useState } from "react";

// 여행 생성 폼의 입력값과 제출 상태를 모아 관리한다.
export function useTripCreateFormState() {
  const [newTripTitle, setNewTripTitle] = useState("");
  const [newTripStartDate, setNewTripStartDate] = useState("");
  const [newTripEndDate, setNewTripEndDate] = useState("");
  const [newTripTravelers, setNewTripTravelers] = useState("");
  const [newTripDestinationCountry, setNewTripDestinationCountry] = useState("JP");
  const [newTripMemo, setNewTripMemo] = useState("");
  const [tripCreateError, setTripCreateError] = useState("");
  const [tripCreateSubmitting, setTripCreateSubmitting] = useState(false);

  // 생성 완료 후 다음 여행을 바로 입력할 수 있도록 사용자 입력값만 비운다.
  function resetTripCreateForm() {
    setNewTripTitle("");
    setNewTripStartDate("");
    setNewTripEndDate("");
    setNewTripTravelers("");
    setNewTripDestinationCountry("JP");
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
    newTripDestinationCountry,
    setNewTripDestinationCountry,
    newTripMemo,
    setNewTripMemo,
    tripCreateError,
    setTripCreateError,
    tripCreateSubmitting,
    setTripCreateSubmitting,
    resetTripCreateForm,
  };
}
