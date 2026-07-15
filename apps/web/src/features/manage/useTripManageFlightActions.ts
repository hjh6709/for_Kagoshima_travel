import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { AuthResponse } from "../../api/auth";
import { createTripFlight, deleteTripFlight, updateTripFlight, type OwnerTrip, type SharedFlight } from "../../api/trips";
import { sortSharedFlights } from "../../shared/sort";
import type { FlightDirection } from "../../shared/travelOptions";
import {
  handleManageApiError,
  isDateOutsideTrip,
  isEndDateBeforeStartDate,
  optionalTrimmedText,
} from "./manageFormUtils";
import { isOnline } from "../../utils/offlineCache";

type FlightFormState = {
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
  cancelFlightEdit: () => void;
  deletingFlightID: string;
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
  setFlightCreateError: Dispatch<SetStateAction<string>>;
  setFlightCreateSubmitting: Dispatch<SetStateAction<boolean>>;
  setDeletingFlightID: Dispatch<SetStateAction<string>>;
  setFlightDeleteError: Dispatch<SetStateAction<string>>;
  setFlightEditError: Dispatch<SetStateAction<string>>;
  setFlightEditSubmitting: Dispatch<SetStateAction<boolean>>;
  setNewFlightAirline: Dispatch<SetStateAction<string>>;
  setNewFlightArrivalAirport: Dispatch<SetStateAction<string>>;
  setNewFlightArrivalTime: Dispatch<SetStateAction<string>>;
  setNewFlightDepartureAirport: Dispatch<SetStateAction<string>>;
  setNewFlightDepartureTime: Dispatch<SetStateAction<string>>;
  setNewFlightLabel: Dispatch<SetStateAction<string>>;
  setNewFlightMemo: Dispatch<SetStateAction<string>>;
  setNewFlightNumber: Dispatch<SetStateAction<string>>;
};

type UseTripManageFlightActionsParams = {
  clearOwnerSession: () => void;
  flightForm: FlightFormState;
  ownerAuth: AuthResponse | null;
  ownerFlights: SharedFlight[];
  selectedOwnerTrip: OwnerTrip | null;
  setOwnerFlights: Dispatch<SetStateAction<SharedFlight[]>>;
};

// 선택 여행의 항공편 생성 액션만 담당한다.
export function useTripManageFlightActions({
  clearOwnerSession,
  flightForm,
  ownerAuth,
  ownerFlights,
  selectedOwnerTrip,
  setOwnerFlights,
}: UseTripManageFlightActionsParams) {
  // 항공편 추가 폼 입력값을 검증한 뒤 서버에 저장하고, 화면 목록에 즉시 반영한다.
  async function submitNewFlight(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ownerAuth || !selectedOwnerTrip) return;

    // [시니어 코드리뷰 반영]: 오프라인 환경 쓰기 동작 방어 가드
    // 오프라인 상태 시 신규 항공편 API 발송을 차단하여 싱크 불일치 에러를 에방합니다.
    if (!isOnline()) {
      flightForm.setFlightCreateError("네트워크 연결이 끊겼습니다. 오프라인 상태에서는 항공편을 추가할 수 없습니다.");
      return;
    }

    const label = flightForm.newFlightLabel.trim();
    const airline = optionalTrimmedText(flightForm.newFlightAirline);
    const flightNumber = optionalTrimmedText(flightForm.newFlightNumber);
    const departureAirport = flightForm.newFlightDepartureAirport.trim();
    const arrivalAirport = flightForm.newFlightArrivalAirport.trim();
    const departureDate = flightForm.newFlightDepartureDate;
    const departureTime = flightForm.newFlightDepartureTime.trim();
    const arrivalDate = flightForm.newFlightArrivalDate;
    const arrivalTime = optionalTrimmedText(flightForm.newFlightArrivalTime);
    const memo = optionalTrimmedText(flightForm.newFlightMemo);

    if (!label || !departureAirport || !arrivalAirport || !departureDate || !departureTime) {
      flightForm.setFlightCreateError("항공편 이름, 출발/도착 공항, 출발 날짜와 시간을 입력해주세요.");
      return;
    }
    if (isDateOutsideTrip(departureDate, selectedOwnerTrip)) {
      flightForm.setFlightCreateError("출발 날짜는 여행 기간 안에서 선택해주세요.");
      return;
    }
    if (arrivalDate && isEndDateBeforeStartDate(departureDate, arrivalDate)) {
      flightForm.setFlightCreateError("도착 날짜는 출발 날짜보다 빠를 수 없습니다.");
      return;
    }

    flightForm.setFlightCreateError("");
    flightForm.setFlightCreateSubmitting(true);
    try {
      const createdFlight = await createTripFlight(ownerAuth.accessToken, selectedOwnerTrip.id, {
        direction: flightForm.newFlightDirection,
        label,
        airline,
        flightNumber,
        departureAirport,
        arrivalAirport,
        departureDate,
        departureTime,
        arrivalDate: arrivalDate || undefined,
        arrivalTime,
        memo,
      });
      setOwnerFlights((currentFlights) => sortSharedFlights([...currentFlights, createdFlight]));
      flightForm.setNewFlightLabel("");
      flightForm.setNewFlightAirline("");
      flightForm.setNewFlightNumber("");
      flightForm.setNewFlightDepartureAirport("");
      flightForm.setNewFlightArrivalAirport("");
      flightForm.setNewFlightDepartureTime("");
      flightForm.setNewFlightArrivalTime("");
      flightForm.setNewFlightMemo("");
      flightForm.setFlightCreateError("");
    } catch (error) {
      handleManageApiError(error, {
        clearOwnerSession,
        fallbackMessage: "항공편을 추가하지 못했습니다.",
        setError: flightForm.setFlightCreateError,
      });
    } finally {
      flightForm.setFlightCreateSubmitting(false);
    }
  }

  // 항공편 수정 폼 입력값을 검증한 뒤 서버에 반영하고, 성공하면 목록의 해당 항공편만 교체한다.
  async function submitFlightEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ownerAuth || !selectedOwnerTrip || !flightForm.editingFlightID) return;

    // [시니어 코드리뷰 반영]: 오프라인 환경 쓰기 동작 방어 가드
    // 오프라인 상태 시 항공편 수정 API 발송을 차단하여 정합성 오류를 미연에 예방합니다.
    if (!isOnline()) {
      flightForm.setFlightEditError("네트워크 연결이 끊겼습니다. 오프라인 상태에서는 항공편을 수정할 수 없습니다.");
      return;
    }

    const label = flightForm.editingFlightLabel.trim();
    const airline = flightForm.editingFlightAirline.trim();
    const flightNumber = flightForm.editingFlightNumber.trim();
    const departureAirport = flightForm.editingFlightDepartureAirport.trim();
    const arrivalAirport = flightForm.editingFlightArrivalAirport.trim();
    const departureDate = flightForm.editingFlightDepartureDate;
    const departureTime = flightForm.editingFlightDepartureTime.trim();
    const arrivalDate = flightForm.editingFlightArrivalDate;
    const arrivalTime = flightForm.editingFlightArrivalTime.trim();
    const memo = flightForm.editingFlightMemo.trim();

    if (!label || !departureAirport || !arrivalAirport || !departureDate || !departureTime) {
      flightForm.setFlightEditError("항공편 이름, 출발/도착 공항, 출발 날짜와 시간을 입력해주세요.");
      return;
    }
    if (isDateOutsideTrip(departureDate, selectedOwnerTrip)) {
      flightForm.setFlightEditError("출발 날짜는 여행 기간 안에서 선택해주세요.");
      return;
    }
    if (arrivalDate && isEndDateBeforeStartDate(departureDate, arrivalDate)) {
      flightForm.setFlightEditError("도착 날짜는 출발 날짜보다 빠를 수 없습니다.");
      return;
    }

    flightForm.setFlightEditError("");
    flightForm.setFlightEditSubmitting(true);
    try {
      // 수정에서는 빈 문자열도 서버로 보내 사용자가 항공사/편명/메모를 지울 수 있게 한다.
      const updatedFlight = await updateTripFlight(
        ownerAuth.accessToken,
        selectedOwnerTrip.id,
        flightForm.editingFlightID,
        {
          direction: flightForm.editingFlightDirection,
          label,
          airline,
          flightNumber,
          departureAirport,
          arrivalAirport,
          departureDate,
          departureTime,
          arrivalDate,
          arrivalTime,
          memo,
        }
      );
      setOwnerFlights((currentFlights) =>
        sortSharedFlights(currentFlights.map((item) => (item.id === updatedFlight.id ? updatedFlight : item)))
      );
      flightForm.cancelFlightEdit();
    } catch (error) {
      handleManageApiError(error, {
        clearOwnerSession,
        fallbackMessage: "항공편을 수정하지 못했습니다.",
        setError: flightForm.setFlightEditError,
      });
    } finally {
      flightForm.setFlightEditSubmitting(false);
    }
  }

  // 항공편 목록의 편집 모드에서 사용자가 선택한 항공편을 삭제한다.
  async function deleteOwnerFlight(flightID: string) {
    if (!ownerAuth || !selectedOwnerTrip) return;

    // [시니어 코드리뷰 반영]: 오프라인 환경 쓰기 동작 방어 가드
    // 오프라인 상태 시 항공편 삭제 API 발송을 차단합니다.
    if (!isOnline()) {
      flightForm.setFlightDeleteError("네트워크 연결이 끊겼습니다. 오프라인 상태에서는 항공편을 삭제할 수 없습니다.");
      return;
    }

    const flight = ownerFlights.find((item) => item.id === flightID);
    const confirmed = window.confirm(flight ? `"${flight.label}" 항공편을 삭제할까요?` : "항공편을 삭제할까요?");
    if (!confirmed) return;

    flightForm.setFlightDeleteError("");
    flightForm.setDeletingFlightID(flightID);
    try {
      await deleteTripFlight(ownerAuth.accessToken, selectedOwnerTrip.id, flightID);
      setOwnerFlights((currentFlights) => currentFlights.filter((item) => item.id !== flightID));
      if (flightForm.editingFlightID === flightID) {
        flightForm.cancelFlightEdit();
      }
      flightForm.setFlightDeleteError("");
    } catch (error) {
      handleManageApiError(error, {
        clearOwnerSession,
        fallbackMessage: "항공편을 삭제하지 못했습니다.",
        setError: flightForm.setFlightDeleteError,
      });
    } finally {
      flightForm.setDeletingFlightID("");
    }
  }

  return {
    deleteOwnerFlight,
    submitFlightEdit,
    submitNewFlight,
  };
}
