import { useEffect, useState } from "react";
import {
  createChecklistItem,
  deleteChecklistItem,
  listChecklist,
  updateChecklistItem,
  type ChecklistItemResponse,
} from "../../api/checklist";
import { handleManageApiError } from "./manageFormUtils";

type UseTripManageChecklistActionsParams = {
  tripID: string | null;           // 선택된 여행 ID
  accessToken: string | null;      // 유저 인증 토큰
  clearOwnerSession: () => void;   // 만료 세션 클린업용 콜백 함수
};

// useTripManageChecklistActions는 여행 상세 관리화면 내 체크리스트 관리 컴포넌트의
// 데이터 패칭, 커스텀 항목 추가, 체크 토글 및 삭제 API 트랜잭션 흐름을 제어하는 커스텀 훅입니다.
export function useTripManageChecklistActions({
  tripID,
  accessToken,
  clearOwnerSession,
}: UseTripManageChecklistActionsParams) {
  const [checklistItems, setChecklistItems] = useState<ChecklistItemResponse[]>([]);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [checklistError, setChecklistError] = useState("");
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newChecklistCategory, setNewChecklistCategory] = useState<"before" | "airport" | "daily" | "return">("before");
  const [checklistSubmitting, setChecklistSubmitting] = useState(false);

  // 여행 정보 또는 토큰 세션이 변경되면, 연결된 체크리스트 리스트를 백엔드 서버로부터 가져옵니다.
  useEffect(() => {
    if (!tripID || !accessToken) {
      setChecklistItems([]);
      return;
    }

    let cancelled = false;
    setChecklistLoading(true);
    setChecklistError("");

    listChecklist(tripID, accessToken)
      .then((items) => {
        if (!cancelled) {
          setChecklistItems(items || []);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setChecklistError(error instanceof Error ? error.message : "준비물 목록을 가져오지 못했습니다.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setChecklistLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tripID, accessToken]);

  // 새로운 커스텀 준비물 항목을 추가 등록합니다.
  async function handleAddChecklistItem(e: React.FormEvent) {
    e.preventDefault();
    if (!tripID || !accessToken) return;
    if (!newChecklistTitle.trim()) return;

    setChecklistSubmitting(true);
    setChecklistError("");

    try {
      const newItem = await createChecklistItem(
        tripID,
        accessToken,
        newChecklistCategory,
        newChecklistTitle.trim()
      );
      setChecklistItems((prev) => [...prev, newItem]);
      setNewChecklistTitle("");
    } catch (error) {
      handleManageApiError(error, {
        clearOwnerSession,
        fallbackMessage: "준비물 추가 실패",
        setError: setChecklistError,
      });
    } finally {
      setChecklistSubmitting(false);
    }
  }

  // 준비물 완료/미완료 토글 처리(isCompleted)를 처리하고 상태를 즉각 동기화합니다.
  async function handleToggleChecklistItem(itemID: string, isCompleted: boolean) {
    if (!accessToken) return;

    try {
      const updated = await updateChecklistItem(itemID, accessToken, { isCompleted });
      setChecklistItems((prev) =>
        prev.map((item) => (item.id === itemID ? updated : item))
      );
    } catch (error) {
      handleManageApiError(error, {
        clearOwnerSession,
        fallbackMessage: "준비물 상태 변경 실패",
        setError: setChecklistError,
      });
    }
  }

  // 준비물 항목을 리포지토리에서 삭제하고 UI 리스트에서도 필터링합니다.
  async function handleDeleteChecklistItem(itemID: string) {
    if (!accessToken) return;

    try {
      await deleteChecklistItem(itemID, accessToken);
      setChecklistItems((prev) => prev.filter((item) => item.id !== itemID));
    } catch (error) {
      handleManageApiError(error, {
        clearOwnerSession,
        fallbackMessage: "준비물 삭제 실패",
        setError: setChecklistError,
      });
    }
  }

  return {
    checklistItems,
    checklistLoading,
    checklistError,
    newChecklistTitle,
    setNewChecklistTitle,
    newChecklistCategory,
    setNewChecklistCategory,
    checklistSubmitting,
    handleAddChecklistItem,
    handleToggleChecklistItem,
    handleDeleteChecklistItem,
  };
}
