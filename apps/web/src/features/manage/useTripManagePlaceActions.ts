import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { AuthResponse } from "../../api/auth";
import { createTripPlace, deleteTripPlace, updateTripPlace, type OwnerTrip, type SharedPlace } from "../../api/trips";
import { sortSharedPlaces } from "../../shared/sort";
import type { PlaceCategory } from "../../types/travel";
import { handleManageApiError, optionalTrimmedText } from "./manageFormUtils";

type PlaceFormState = {
  newPlaceAddress: string;
  newPlaceCategory: PlaceCategory;
  newPlaceGoogleMapsURL: string;
  newPlaceName: string;
  newPlaceRecommendedReason: string;
  cancelPlaceEdit: () => void;
  editingPlaceAddress: string;
  editingPlaceCategory: PlaceCategory;
  editingPlaceGoogleMapsURL: string;
  editingPlaceID: string;
  editingPlaceName: string;
  editingPlaceRecommendedReason: string;
  setDeletingPlaceID: Dispatch<SetStateAction<string>>;
  setPlaceEditError: Dispatch<SetStateAction<string>>;
  setPlaceEditSubmitting: Dispatch<SetStateAction<boolean>>;
  setNewPlaceAddress: Dispatch<SetStateAction<string>>;
  setNewPlaceGoogleMapsURL: Dispatch<SetStateAction<string>>;
  setNewPlaceName: Dispatch<SetStateAction<string>>;
  setNewPlaceRecommendedReason: Dispatch<SetStateAction<string>>;
  setNewSchedulePlaceID: Dispatch<SetStateAction<string>>;
  setPlaceCreateError: Dispatch<SetStateAction<string>>;
  setPlaceCreateSubmitting: Dispatch<SetStateAction<boolean>>;
  setPlaceDeleteError: Dispatch<SetStateAction<string>>;
};

type UseTripManagePlaceActionsParams = {
  clearOwnerSession: () => void;
  ownerAuth: AuthResponse | null;
  ownerPlaces: SharedPlace[];
  placeForm: PlaceFormState;
  selectedOwnerTrip: OwnerTrip | null;
  setOwnerPlaces: Dispatch<SetStateAction<SharedPlace[]>>;
};

// 선택 여행의 장소 생성/삭제 액션만 담당한다.
export function useTripManagePlaceActions({
  clearOwnerSession,
  ownerAuth,
  ownerPlaces,
  placeForm,
  selectedOwnerTrip,
  setOwnerPlaces,
}: UseTripManagePlaceActionsParams) {
  // 장소 추가 폼 입력값을 검증한 뒤 서버에 저장하고, 새 일정의 연결 장소로 선택한다.
  async function submitNewPlace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ownerAuth || !selectedOwnerTrip) return;

    const name = placeForm.newPlaceName.trim();
    const address = optionalTrimmedText(placeForm.newPlaceAddress);
    const googleMapsUrl = optionalTrimmedText(placeForm.newPlaceGoogleMapsURL);
    const recommendedReason = optionalTrimmedText(placeForm.newPlaceRecommendedReason);

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
        address,
        googleMapsUrl,
        recommendedReason,
      });
      setOwnerPlaces((currentPlaces) => sortSharedPlaces([...currentPlaces, createdPlace]));
      placeForm.setNewSchedulePlaceID(createdPlace.id);
      placeForm.setNewPlaceName("");
      placeForm.setNewPlaceAddress("");
      placeForm.setNewPlaceGoogleMapsURL("");
      placeForm.setNewPlaceRecommendedReason("");
      placeForm.setPlaceCreateError("");
    } catch (error) {
      handleManageApiError(error, {
        clearOwnerSession,
        fallbackMessage: "장소를 추가하지 못했습니다.",
        setError: placeForm.setPlaceCreateError,
      });
    } finally {
      placeForm.setPlaceCreateSubmitting(false);
    }
  }

  // 장소 수정 폼 입력값을 검증한 뒤 서버에 반영하고, 성공하면 목록의 해당 장소만 교체한다.
  async function submitPlaceEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ownerAuth || !selectedOwnerTrip || !placeForm.editingPlaceID) return;

    const name = placeForm.editingPlaceName.trim();
    const address = optionalTrimmedText(placeForm.editingPlaceAddress);
    const googleMapsUrl = optionalTrimmedText(placeForm.editingPlaceGoogleMapsURL);
    const recommendedReason = optionalTrimmedText(placeForm.editingPlaceRecommendedReason);

    if (!name) {
      placeForm.setPlaceEditError("장소 이름을 입력해주세요.");
      return;
    }

    placeForm.setPlaceEditError("");
    placeForm.setPlaceEditSubmitting(true);
    try {
      const updatedPlace = await updateTripPlace(ownerAuth.accessToken, selectedOwnerTrip.id, placeForm.editingPlaceID, {
        name,
        category: placeForm.editingPlaceCategory,
        address,
        googleMapsUrl,
        recommendedReason,
      });
      setOwnerPlaces((currentPlaces) =>
        sortSharedPlaces(currentPlaces.map((item) => (item.id === updatedPlace.id ? updatedPlace : item)))
      );
      placeForm.cancelPlaceEdit();
    } catch (error) {
      handleManageApiError(error, {
        clearOwnerSession,
        fallbackMessage: "장소를 수정하지 못했습니다.",
        setError: placeForm.setPlaceEditError,
      });
    } finally {
      placeForm.setPlaceEditSubmitting(false);
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
      if (placeForm.editingPlaceID === placeID) {
        placeForm.cancelPlaceEdit();
      }
      placeForm.setPlaceDeleteError("");
    } catch (error) {
      handleManageApiError(error, {
        clearOwnerSession,
        fallbackMessage: "장소를 삭제하지 못했습니다.",
        setError: placeForm.setPlaceDeleteError,
      });
    } finally {
      placeForm.setDeletingPlaceID("");
    }
  }

  return {
    deleteOwnerPlace,
    submitNewPlace,
    submitPlaceEdit,
  };
}
