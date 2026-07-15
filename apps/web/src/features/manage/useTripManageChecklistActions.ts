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
  tripID: string | null;
  accessToken: string | null;
  clearOwnerSession: () => void;
};

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

  // 여행이 변경되면 체크리스트 데이터를 서버로부터 읽어온다.
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
