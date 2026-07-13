import { useState } from "react";
import type { SharedFlight } from "../../api/trips";
import type { FlightDirection } from "../../shared/travelOptions";

// 항공편 추가/수정 폼과 항공편 목록 편집 상태를 모아 관리한다.
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
  const [isFlightListEditing, setIsFlightListEditing] = useState(false);
  const [flightDeleteError, setFlightDeleteError] = useState("");
  const [deletingFlightID, setDeletingFlightID] = useState("");
  const [editingFlightID, setEditingFlightID] = useState("");
  const [editingFlightDirection, setEditingFlightDirection] = useState<FlightDirection>("departure");
  const [editingFlightLabel, setEditingFlightLabel] = useState("");
  const [editingFlightAirline, setEditingFlightAirline] = useState("");
  const [editingFlightNumber, setEditingFlightNumber] = useState("");
  const [editingFlightDepartureAirport, setEditingFlightDepartureAirport] = useState("");
  const [editingFlightArrivalAirport, setEditingFlightArrivalAirport] = useState("");
  const [editingFlightDepartureDate, setEditingFlightDepartureDate] = useState("");
  const [editingFlightDepartureTime, setEditingFlightDepartureTime] = useState("");
  const [editingFlightArrivalDate, setEditingFlightArrivalDate] = useState("");
  const [editingFlightArrivalTime, setEditingFlightArrivalTime] = useState("");
  const [editingFlightMemo, setEditingFlightMemo] = useState("");
  const [flightEditError, setFlightEditError] = useState("");
  const [flightEditSubmitting, setFlightEditSubmitting] = useState(false);

  // 항공편 수정 폼을 닫을 때는 편집 대상과 입력값을 함께 비운다.
  function cancelFlightEdit() {
    setEditingFlightID("");
    setEditingFlightDirection("departure");
    setEditingFlightLabel("");
    setEditingFlightAirline("");
    setEditingFlightNumber("");
    setEditingFlightDepartureAirport("");
    setEditingFlightArrivalAirport("");
    setEditingFlightDepartureDate("");
    setEditingFlightDepartureTime("");
    setEditingFlightArrivalDate("");
    setEditingFlightArrivalTime("");
    setEditingFlightMemo("");
    setFlightEditError("");
    setFlightEditSubmitting(false);
  }

  // 목록 카드의 수정 버튼을 누르면 현재 서버 항공편 값을 편집 폼 초기값으로 복사한다.
  function startFlightEdit(flight: SharedFlight) {
    setEditingFlightID(flight.id);
    setEditingFlightDirection(flight.direction as FlightDirection);
    setEditingFlightLabel(flight.label);
    setEditingFlightAirline(flight.airline ?? "");
    setEditingFlightNumber(flight.flightNumber ?? "");
    setEditingFlightDepartureAirport(flight.departureAirport);
    setEditingFlightArrivalAirport(flight.arrivalAirport);
    setEditingFlightDepartureDate(flight.departureDate);
    setEditingFlightDepartureTime(flight.departureTime);
    setEditingFlightArrivalDate(flight.arrivalDate ?? "");
    setEditingFlightArrivalTime(flight.arrivalTime ?? "");
    setEditingFlightMemo(flight.memo ?? "");
    setFlightEditError("");
  }

  // 선택 여행이 닫히면 항공편 입력값과 목록 편집 상태를 완전히 비운다.
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
    setIsFlightListEditing(false);
    setFlightDeleteError("");
    setDeletingFlightID("");
    cancelFlightEdit();
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
    setIsFlightListEditing(false);
    setFlightDeleteError("");
    setDeletingFlightID("");
    cancelFlightEdit();
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
    isFlightListEditing,
    setIsFlightListEditing,
    flightDeleteError,
    setFlightDeleteError,
    deletingFlightID,
    setDeletingFlightID,
    editingFlightID,
    editingFlightDirection,
    setEditingFlightDirection,
    editingFlightLabel,
    setEditingFlightLabel,
    editingFlightAirline,
    setEditingFlightAirline,
    editingFlightNumber,
    setEditingFlightNumber,
    editingFlightDepartureAirport,
    setEditingFlightDepartureAirport,
    editingFlightArrivalAirport,
    setEditingFlightArrivalAirport,
    editingFlightDepartureDate,
    setEditingFlightDepartureDate,
    editingFlightDepartureTime,
    setEditingFlightDepartureTime,
    editingFlightArrivalDate,
    setEditingFlightArrivalDate,
    editingFlightArrivalTime,
    setEditingFlightArrivalTime,
    editingFlightMemo,
    setEditingFlightMemo,
    flightEditError,
    setFlightEditError,
    flightEditSubmitting,
    setFlightEditSubmitting,
    cancelFlightEdit,
    startFlightEdit,
    resetFlightManageForm,
    prepareFlightManageForm,
  };
}
