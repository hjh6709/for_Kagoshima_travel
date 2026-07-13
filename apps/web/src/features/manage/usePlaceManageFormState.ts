import { useState } from "react";
import type { PlaceCategory } from "../../types/travel";

// 장소 추가 폼과 장소 목록 편집 상태를 모아 관리한다.
export function usePlaceManageFormState() {
  const [newPlaceName, setNewPlaceName] = useState("");
  const [newPlaceCategory, setNewPlaceCategory] = useState<PlaceCategory>("sightseeing");
  const [newPlaceAddress, setNewPlaceAddress] = useState("");
  const [newPlaceGoogleMapsURL, setNewPlaceGoogleMapsURL] = useState("");
  const [newPlaceRecommendedReason, setNewPlaceRecommendedReason] = useState("");
  const [placeCreateError, setPlaceCreateError] = useState("");
  const [placeCreateSubmitting, setPlaceCreateSubmitting] = useState(false);
  const [isPlaceListEditing, setIsPlaceListEditing] = useState(false);
  const [placeDeleteError, setPlaceDeleteError] = useState("");
  const [deletingPlaceID, setDeletingPlaceID] = useState("");

  // 장소 입력값과 목록 편집 상태를 함께 초기화해 다른 여행의 삭제 상태가 섞이지 않게 한다.
  function resetPlaceManageForm() {
    setNewPlaceName("");
    setNewPlaceCategory("sightseeing");
    setNewPlaceAddress("");
    setNewPlaceGoogleMapsURL("");
    setNewPlaceRecommendedReason("");
    setPlaceCreateError("");
    setIsPlaceListEditing(false);
    setPlaceDeleteError("");
    setDeletingPlaceID("");
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
    resetPlaceManageForm,
  };
}
