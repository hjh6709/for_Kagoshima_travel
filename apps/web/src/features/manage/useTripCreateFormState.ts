import { useState } from "react";

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
