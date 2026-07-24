import { useState } from "react";
import type { SharedPlace } from "../../api/trips";
import type { PlaceCategory } from "../../types/travel";

// 장소 추가/수정 폼과 장소 목록 편집 상태를 모아 관리한다.
export function usePlaceManageFormState() {
  const [newPlaceName, setNewPlaceName] = useState("");
  const [newPlaceCategory, setNewPlaceCategory] = useState<PlaceCategory>("sightseeing");
  const [newPlaceAddress, setNewPlaceAddress] = useState("");
  const [newPlaceGoogleMapsURL, setNewPlaceGoogleMapsURL] = useState("");
  const [newPlaceRecommendedReason, setNewPlaceRecommendedReason] = useState("");
  const [newPlaceChineseName, setNewPlaceChineseName] = useState("");
  const [newPlaceChineseAddress, setNewPlaceChineseAddress] = useState("");
  const [newPlaceSubwayExit, setNewPlaceSubwayExit] = useState("");
  const [newPlaceTaxiPhrase, setNewPlaceTaxiPhrase] = useState("");
  const [placeCreateError, setPlaceCreateError] = useState("");
  const [placeCreateSubmitting, setPlaceCreateSubmitting] = useState(false);
  const [isPlaceListEditing, setIsPlaceListEditing] = useState(false);
  const [placeDeleteError, setPlaceDeleteError] = useState("");
  const [deletingPlaceID, setDeletingPlaceID] = useState("");
  const [editingPlaceID, setEditingPlaceID] = useState("");
  const [editingPlaceName, setEditingPlaceName] = useState("");
  const [editingPlaceCategory, setEditingPlaceCategory] = useState<PlaceCategory>("sightseeing");
  const [editingPlaceAddress, setEditingPlaceAddress] = useState("");
  const [editingPlaceGoogleMapsURL, setEditingPlaceGoogleMapsURL] = useState("");
  const [editingPlaceRecommendedReason, setEditingPlaceRecommendedReason] = useState("");
  const [editingPlaceChineseName, setEditingPlaceChineseName] = useState("");
  const [editingPlaceChineseAddress, setEditingPlaceChineseAddress] = useState("");
  const [editingPlaceSubwayExit, setEditingPlaceSubwayExit] = useState("");
  const [editingPlaceTaxiPhrase, setEditingPlaceTaxiPhrase] = useState("");
  const [placeEditError, setPlaceEditError] = useState("");
  const [placeEditSubmitting, setPlaceEditSubmitting] = useState(false);

  // 수정 폼을 닫을 때는 편집 대상과 입력값을 함께 비운다.
  function cancelPlaceEdit() {
    setEditingPlaceID("");
    setEditingPlaceName("");
    setEditingPlaceCategory("sightseeing");
    setEditingPlaceAddress("");
    setEditingPlaceGoogleMapsURL("");
    setEditingPlaceRecommendedReason("");
    setEditingPlaceChineseName("");
    setEditingPlaceChineseAddress("");
    setEditingPlaceSubwayExit("");
    setEditingPlaceTaxiPhrase("");
    setPlaceEditError("");
    setPlaceEditSubmitting(false);
  }

  // 목록 카드의 수정 버튼을 누르면 현재 서버 장소 값을 편집 폼 초기값으로 복사한다.
  function startPlaceEdit(place: SharedPlace) {
    setEditingPlaceID(place.id);
    setEditingPlaceName(place.name);
    setEditingPlaceCategory(place.category as PlaceCategory);
    setEditingPlaceAddress(place.address ?? "");
    setEditingPlaceGoogleMapsURL(place.googleMapsUrl ?? "");
    setEditingPlaceRecommendedReason(place.recommendedReason ?? "");
    setEditingPlaceChineseName(place.chineseName ?? "");
    setEditingPlaceChineseAddress(place.chineseAddress ?? "");
    setEditingPlaceSubwayExit(place.subwayExit ?? "");
    setEditingPlaceTaxiPhrase(place.taxiPhrase ?? "");
    setPlaceEditError("");
  }

  // 장소 입력값과 목록 편집 상태를 함께 초기화해 다른 여행의 삭제 상태가 섞이지 않게 한다.
  function resetPlaceManageForm() {
    setNewPlaceName("");
    setNewPlaceCategory("sightseeing");
    setNewPlaceAddress("");
    setNewPlaceGoogleMapsURL("");
    setNewPlaceRecommendedReason("");
    setNewPlaceChineseName("");
    setNewPlaceChineseAddress("");
    setNewPlaceSubwayExit("");
    setNewPlaceTaxiPhrase("");
    setPlaceCreateError("");
    setIsPlaceListEditing(false);
    setPlaceDeleteError("");
    setDeletingPlaceID("");
    cancelPlaceEdit();
  }

  return {
    newPlaceName,
    setNewPlaceName,
    newPlaceCategory,
    setNewPlaceCategory,
    newPlaceAddress,
    setNewPlaceAddress,
    newPlaceGoogleMapsURL,
    setNewPlaceGoogleMapsURL,
    newPlaceRecommendedReason,
    setNewPlaceRecommendedReason,
    newPlaceChineseName,
    setNewPlaceChineseName,
    newPlaceChineseAddress,
    setNewPlaceChineseAddress,
    newPlaceSubwayExit,
    setNewPlaceSubwayExit,
    newPlaceTaxiPhrase,
    setNewPlaceTaxiPhrase,
    placeCreateError,
    setPlaceCreateError,
    placeCreateSubmitting,
    setPlaceCreateSubmitting,
    isPlaceListEditing,
    setIsPlaceListEditing,
    placeDeleteError,
    setPlaceDeleteError,
    deletingPlaceID,
    setDeletingPlaceID,
    editingPlaceID,
    editingPlaceName,
    setEditingPlaceName,
    editingPlaceCategory,
    setEditingPlaceCategory,
    editingPlaceAddress,
    setEditingPlaceAddress,
    editingPlaceGoogleMapsURL,
    setEditingPlaceGoogleMapsURL,
    editingPlaceRecommendedReason,
    setEditingPlaceRecommendedReason,
    editingPlaceChineseName,
    setEditingPlaceChineseName,
    editingPlaceChineseAddress,
    setEditingPlaceChineseAddress,
    editingPlaceSubwayExit,
    setEditingPlaceSubwayExit,
    editingPlaceTaxiPhrase,
    setEditingPlaceTaxiPhrase,
    placeEditError,
    setPlaceEditError,
    placeEditSubmitting,
    setPlaceEditSubmitting,
    cancelPlaceEdit,
    startPlaceEdit,
    resetPlaceManageForm,
  };
}
