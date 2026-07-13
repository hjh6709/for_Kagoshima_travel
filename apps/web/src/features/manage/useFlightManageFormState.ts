import { useState } from "react";
import type { FlightDirection } from "../../shared/travelOptions";

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

  // 선택 여행이 닫히면 항공편 입력값을 완전히 비운다.
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

  // 새 여행을 선택하면 출발/도착 날짜를 여행 시작일로 맞춰 바로 입력할 수 있게 한다.
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
