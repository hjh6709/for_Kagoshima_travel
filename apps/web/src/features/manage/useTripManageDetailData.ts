import { useEffect, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { ApiError, type AuthResponse } from "../../api/auth";
import {
  createTripFlight,
  createTripPlace,
  createTripSchedule,
  deleteTripPlace,
  deleteTripSchedule,
  listTripFlights,
  listTripPlaces,
  listTripSchedules,
  type OwnerTrip,
  type SharedFlight,
  type SharedPlace,
  type SharedSchedule,
} from "../../api/trips";
import { sortSharedFlights, sortSharedPlaces, sortSharedSchedules } from "../../shared/sort";
import type { FlightDirection } from "../../shared/travelOptions";
import type { PlaceCategory, ScheduleItem } from "../../types/travel";

type UseTripManageDetailDataParams = {
  clearOwnerSession: () => void;
  ownerAuth: AuthResponse | null;
  selectedOwnerTrip: OwnerTrip | null;
  scheduleForm: {
    newScheduleDate: string;
    newScheduleGuideMemo: string;
    newSchedulePlaceID: string;
    newScheduleTime: string;
    newScheduleTitle: string;
    newScheduleTransportMemo: string;
    newScheduleType: ScheduleItem["type"];
    setDeletingScheduleID: Dispatch<SetStateAction<string>>;
    setNewScheduleGuideMemo: Dispatch<SetStateAction<string>>;
    setNewSchedulePlaceID: Dispatch<SetStateAction<string>>;
    setNewScheduleTime: Dispatch<SetStateAction<string>>;
    setNewScheduleTitle: Dispatch<SetStateAction<string>>;
    setNewScheduleTransportMemo: Dispatch<SetStateAction<string>>;
    setScheduleCreateError: Dispatch<SetStateAction<string>>;
    setScheduleCreateSubmitting: Dispatch<SetStateAction<boolean>>;
    setScheduleDeleteError: Dispatch<SetStateAction<string>>;
  };
  placeForm: {
    newPlaceAddress: string;
    newPlaceCategory: PlaceCategory;
    newPlaceGoogleMapsURL: string;
    newPlaceName: string;
    newPlaceRecommendedReason: string;
    setDeletingPlaceID: Dispatch<SetStateAction<string>>;
    setNewPlaceAddress: Dispatch<SetStateAction<string>>;
    setNewPlaceGoogleMapsURL: Dispatch<SetStateAction<string>>;
    setNewPlaceName: Dispatch<SetStateAction<string>>;
    setNewPlaceRecommendedReason: Dispatch<SetStateAction<string>>;
    setNewSchedulePlaceID: Dispatch<SetStateAction<string>>;
    setPlaceCreateError: Dispatch<SetStateAction<string>>;
    setPlaceCreateSubmitting: Dispatch<SetStateAction<boolean>>;
    setPlaceDeleteError: Dispatch<SetStateAction<string>>;
  };
  flightForm: {
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
};

// 선택한 여행의 일정, 장소, 항공편 서버 데이터와 생성/삭제 핸들러를 담당한다.
export function useTripManageDetailData({
  clearOwnerSession,
  ownerAuth,
  selectedOwnerTrip,
  scheduleForm,
  placeForm,
  flightForm,
}: UseTripManageDetailDataParams) {
  const [ownerSchedules, setOwnerSchedules] = useState<SharedSchedule[]>([]);
  const [ownerPlaces, setOwnerPlaces] = useState<SharedPlace[]>([]);
  const [ownerFlights, setOwnerFlights] = useState<SharedFlight[]>([]);
  const [ownerDetailDataError, setOwnerDetailDataError] = useState("");
  const [ownerDetailDataLoading, setOwnerDetailDataLoading] = useState(false);

  // 선택 여행이 없거나 인증이 끊겼을 때 상세 화면에 남은 서버 데이터를 정리한다.
  function clearOwnerDetailData() {
    setOwnerSchedules([]);
    setOwnerPlaces([]);
    setOwnerFlights([]);
    setOwnerDetailDataError("");
    setOwnerDetailDataLoading(false);
  }

  useEffect(() => {
    if (!ownerAuth || !selectedOwnerTrip) {
      clearOwnerDetailData();
      return;
    }

    let cancelled = false;
    setOwnerDetailDataLoading(true);
    setOwnerDetailDataError("");
    Promise.all([
      listTripSchedules(ownerAuth.accessToken, selectedOwnerTrip.id),
      listTripPlaces(ownerAuth.accessToken, selectedOwnerTrip.id),
      listTripFlights(ownerAuth.accessToken, selectedOwnerTrip.id),
    ])
      .then(([nextSchedules, nextPlaces, nextFlights]) => {
        if (cancelled) return;
        setOwnerSchedules(sortSharedSchedules(nextSchedules));
        setOwnerPlaces(sortSharedPlaces(nextPlaces));
        setOwnerFlights(sortSharedFlights(nextFlights));
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) {
          clearOwnerSession();
          setOwnerDetailDataError("");
          return;
        }
        setOwnerSchedules([]);
        setOwnerPlaces([]);
        setOwnerFlights([]);
        setOwnerDetailDataError(error instanceof Error ? error.message : "여행 상세 데이터를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setOwnerDetailDataLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ownerAuth, selectedOwnerTrip]);

  // 일정 추가 폼 입력값을 검증한 뒤 서버에 저장하고, 성공하면 화면 목록에 즉시 반영한다.
  async function submitNewSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ownerAuth || !selectedOwnerTrip) return;

    const date = scheduleForm.newScheduleDate;
    const time = scheduleForm.newScheduleTime.trim();
    const title = scheduleForm.newScheduleTitle.trim();
    const transportMemo = scheduleForm.newScheduleTransportMemo.trim();
    const guideMemo = scheduleForm.newScheduleGuideMemo.trim();

    if (!date || !time || !title) {
      scheduleForm.setScheduleCreateError("날짜, 시간, 제목을 입력해주세요.");
      return;
    }
    if (date < selectedOwnerTrip.startDate || date > selectedOwnerTrip.endDate) {
      scheduleForm.setScheduleCreateError("일정 날짜는 여행 기간 안에서 선택해주세요.");
      return;
    }

    scheduleForm.setScheduleCreateError("");
    scheduleForm.setScheduleCreateSubmitting(true);
    try {
      const createdSchedule = await createTripSchedule(ownerAuth.accessToken, selectedOwnerTrip.id, {
        date,
        time,
        type: scheduleForm.newScheduleType,
        title,
        placeId: scheduleForm.newSchedulePlaceID || undefined,
        transportMemo: transportMemo || undefined,
        guideMemo: guideMemo || undefined,
      });
      setOwnerSchedules((currentSchedules) => sortSharedSchedules([...currentSchedules, createdSchedule]));
      scheduleForm.setNewScheduleTime("");
      scheduleForm.setNewScheduleTitle("");
      scheduleForm.setNewSchedulePlaceID("");
      scheduleForm.setNewScheduleTransportMemo("");
      scheduleForm.setNewScheduleGuideMemo("");
      scheduleForm.setScheduleCreateError("");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearOwnerSession();
        scheduleForm.setScheduleCreateError("");
        return;
      }
      scheduleForm.setScheduleCreateError(error instanceof Error ? error.message : "일정을 추가하지 못했습니다.");
    } finally {
      scheduleForm.setScheduleCreateSubmitting(false);
    }
  }

  // 일정 목록의 편집 모드에서 사용자가 선택한 일정을 삭제한다.
  async function deleteOwnerSchedule(scheduleID: string) {
    if (!ownerAuth || !selectedOwnerTrip) return;

    const schedule = ownerSchedules.find((item) => item.id === scheduleID);
    const confirmed = window.confirm(schedule ? `"${schedule.title}" 일정을 삭제할까요?` : "일정을 삭제할까요?");
    if (!confirmed) return;

    scheduleForm.setScheduleDeleteError("");
    scheduleForm.setDeletingScheduleID(scheduleID);
    try {
      await deleteTripSchedule(ownerAuth.accessToken, selectedOwnerTrip.id, scheduleID);
      setOwnerSchedules((currentSchedules) => currentSchedules.filter((item) => item.id !== scheduleID));
      scheduleForm.setScheduleDeleteError("");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearOwnerSession();
        scheduleForm.setScheduleDeleteError("");
        return;
      }
      scheduleForm.setScheduleDeleteError(error instanceof Error ? error.message : "일정을 삭제하지 못했습니다.");
    } finally {
      scheduleForm.setDeletingScheduleID("");
    }
  }

  // 장소 추가 폼 입력값을 검증한 뒤 서버에 저장하고, 새 일정의 연결 장소로 선택한다.
  async function submitNewPlace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ownerAuth || !selectedOwnerTrip) return;

    const name = placeForm.newPlaceName.trim();
    const address = placeForm.newPlaceAddress.trim();
    const googleMapsUrl = placeForm.newPlaceGoogleMapsURL.trim();
    const recommendedReason = placeForm.newPlaceRecommendedReason.trim();

    if (!name) {
      placeForm.setPlaceCreateError("장소 이름을 입력해주세요.");
      return;
    }

    placeForm.setPlaceCreateError("");
    placeForm.setPlaceCreateSubmitting(true);
    try {
      const createdPlace = await createTripPlace(ownerAuth.accessToken, selectedOwnerTrip.id, {
        name,
        category: placeForm.newPlaceCategory,
        address: address || undefined,
        googleMapsUrl: googleMapsUrl || undefined,
        recommendedReason: recommendedReason || undefined,
      });
      setOwnerPlaces((currentPlaces) => sortSharedPlaces([...currentPlaces, createdPlace]));
      placeForm.setNewSchedulePlaceID(createdPlace.id);
      placeForm.setNewPlaceName("");
      placeForm.setNewPlaceAddress("");
      placeForm.setNewPlaceGoogleMapsURL("");
      placeForm.setNewPlaceRecommendedReason("");
      placeForm.setPlaceCreateError("");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearOwnerSession();
        placeForm.setPlaceCreateError("");
        return;
      }
      placeForm.setPlaceCreateError(error instanceof Error ? error.message : "장소를 추가하지 못했습니다.");
    } finally {
      placeForm.setPlaceCreateSubmitting(false);
    }
  }

  // 장소를 삭제하면 장소 목록과 새 일정의 연결 장소 선택 상태를 함께 정리한다.
  async function deleteOwnerPlace(placeID: string) {
    if (!ownerAuth || !selectedOwnerTrip) return;

    const place = ownerPlaces.find((item) => item.id === placeID);
    const confirmed = window.confirm(
      place ? `"${place.name}" 장소를 삭제할까요? 연결된 일정에서는 장소 표시가 사라집니다.` : "장소를 삭제할까요?"
    );
    if (!confirmed) return;

    placeForm.setPlaceDeleteError("");
    placeForm.setDeletingPlaceID(placeID);
    try {
      await deleteTripPlace(ownerAuth.accessToken, selectedOwnerTrip.id, placeID);
      setOwnerPlaces((currentPlaces) => currentPlaces.filter((item) => item.id !== placeID));
      placeForm.setNewSchedulePlaceID((currentPlaceID) => (currentPlaceID === placeID ? "" : currentPlaceID));
      placeForm.setPlaceDeleteError("");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearOwnerSession();
        placeForm.setPlaceDeleteError("");
        return;
      }
      placeForm.setPlaceDeleteError(error instanceof Error ? error.message : "장소를 삭제하지 못했습니다.");
    } finally {
      placeForm.setDeletingPlaceID("");
    }
  }

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
  };
}
