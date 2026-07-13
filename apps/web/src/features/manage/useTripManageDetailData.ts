import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { AuthResponse } from "../../api/auth";
import {
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
import { handleManageApiError } from "./manageFormUtils";
import { useTripManageFlightActions } from "./useTripManageFlightActions";
import { useTripManagePlaceActions } from "./useTripManagePlaceActions";
import { useTripManageScheduleActions } from "./useTripManageScheduleActions";

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
    cancelScheduleEdit: () => void;
    editingScheduleDate: string;
    editingScheduleGuideMemo: string;
    editingScheduleID: string;
    editingSchedulePlaceID: string;
    editingScheduleTime: string;
    editingScheduleTitle: string;
    editingScheduleTransportMemo: string;
    editingScheduleType: ScheduleItem["type"];
    setDeletingScheduleID: Dispatch<SetStateAction<string>>;
    setNewScheduleGuideMemo: Dispatch<SetStateAction<string>>;
    setNewSchedulePlaceID: Dispatch<SetStateAction<string>>;
    setNewScheduleTime: Dispatch<SetStateAction<string>>;
    setNewScheduleTitle: Dispatch<SetStateAction<string>>;
    setNewScheduleTransportMemo: Dispatch<SetStateAction<string>>;
    setScheduleCreateError: Dispatch<SetStateAction<string>>;
    setScheduleCreateSubmitting: Dispatch<SetStateAction<boolean>>;
    setScheduleDeleteError: Dispatch<SetStateAction<string>>;
    setScheduleEditError: Dispatch<SetStateAction<string>>;
    setScheduleEditSubmitting: Dispatch<SetStateAction<boolean>>;
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

// 선택한 여행의 일정, 장소, 항공편 서버 데이터 조회와 리소스별 액션 훅 연결을 담당한다.
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

    // 상세 화면은 일정/장소/항공편을 한 세트로 보여주므로 선택 여행 변경 시 함께 다시 조회한다.
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
        setOwnerSchedules([]);
        setOwnerPlaces([]);
        setOwnerFlights([]);
        handleManageApiError(error, {
          clearOwnerSession,
          fallbackMessage: "여행 상세 데이터를 불러오지 못했습니다.",
          setError: setOwnerDetailDataError,
        });
      })
      .finally(() => {
        if (!cancelled) setOwnerDetailDataLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ownerAuth, selectedOwnerTrip]);

  // 생성/삭제 액션은 리소스별 훅으로 위임하고, 여기서는 조회된 목록 state만 공유한다.
  const { deleteOwnerSchedule, submitNewSchedule, submitScheduleEdit } = useTripManageScheduleActions({
    clearOwnerSession,
    ownerAuth,
    ownerSchedules,
    scheduleForm,
    selectedOwnerTrip,
    setOwnerSchedules,
  });
  const { deleteOwnerPlace, submitNewPlace } = useTripManagePlaceActions({
    clearOwnerSession,
    ownerAuth,
    ownerPlaces,
    placeForm,
    selectedOwnerTrip,
    setOwnerPlaces,
  });
  const { submitNewFlight } = useTripManageFlightActions({
    clearOwnerSession,
    flightForm,
    ownerAuth,
    selectedOwnerTrip,
    setOwnerFlights,
  });

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
    submitScheduleEdit,
  };
}
