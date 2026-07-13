import type { Dispatch, FormEvent, SetStateAction } from "react";
import { ApiError, type AuthResponse } from "../../api/auth";
import { createTripFlight, type OwnerTrip, type SharedFlight } from "../../api/trips";
import { sortSharedFlights } from "../../shared/sort";
import type { FlightDirection } from "../../shared/travelOptions";

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
  setFlightCreateError: Dispatch<SetStateAction<string>>;
  setFlightCreateSubmitting: Dispatch<SetStateAction<boolean>>;
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
  selectedOwnerTrip: OwnerTrip | null;
  setOwnerFlights: Dispatch<SetStateAction<SharedFlight[]>>;
};

// 선택 여행의 항공편 생성 액션만 담당한다.
export function useTripManageFlightActions({
  clearOwnerSession,
  flightForm,
  ownerAuth,
  selectedOwnerTrip,
  setOwnerFlights,
}: UseTripManageFlightActionsParams) {
  // 항공편 추가 폼 입력값을 검증한 뒤 서버에 저장하고, 화면 목록에 즉시 반영한다.
  async function submitNewFlight(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ownerAuth || !selectedOwnerTrip) return;

    const label = flightForm.newFlightLabel.trim();
    const airline = flightForm.newFlightAirline.trim();
    const flightNumber = flightForm.newFlightNumber.trim();
    const departureAirport = flightForm.newFlightDepartureAirport.trim();
    const arrivalAirport = flightForm.newFlightArrivalAirport.trim();
    const departureDate = flightForm.newFlightDepartureDate;
    const departureTime = flightForm.newFlightDepartureTime.trim();
    const arrivalDate = flightForm.newFlightArrivalDate;
    const arrivalTime = flightForm.newFlightArrivalTime.trim();
    const memo = flightForm.newFlightMemo.trim();

    if (!label || !departureAirport || !arrivalAirport || !departureDate || !departureTime) {
      flightForm.setFlightCreateError("항공편 이름, 출발/도착 공항, 출발 날짜와 시간을 입력해주세요.");
      return;
    }
    if (departureDate < selectedOwnerTrip.startDate || departureDate > selectedOwnerTrip.endDate) {
      flightForm.setFlightCreateError("출발 날짜는 여행 기간 안에서 선택해주세요.");
      return;
    }
    if (arrivalDate && arrivalDate < departureDate) {
      flightForm.setFlightCreateError("도착 날짜는 출발 날짜보다 빠를 수 없습니다.");
      return;
    }

    flightForm.setFlightCreateError("");
    flightForm.setFlightCreateSubmitting(true);
    try {
      const createdFlight = await createTripFlight(ownerAuth.accessToken, selectedOwnerTrip.id, {
        direction: flightForm.newFlightDirection,
        label,
        airline: airline || undefined,
        flightNumber: flightNumber || undefined,
        departureAirport,
        arrivalAirport,
        departureDate,
        departureTime,
        arrivalDate: arrivalDate || undefined,
        arrivalTime: arrivalTime || undefined,
        memo: memo || undefined,
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
      if (error instanceof ApiError && error.status === 401) {
        clearOwnerSession();
        flightForm.setFlightCreateError("");
        return;
      }
      flightForm.setFlightCreateError(error instanceof Error ? error.message : "항공편을 추가하지 못했습니다.");
    } finally {
      flightForm.setFlightCreateSubmitting(false);
    }
  }

  return {
    submitNewFlight,
  };
}
