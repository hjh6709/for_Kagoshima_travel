import { useEffect, useState } from "react";
import { ApiError, type AuthResponse } from "../../api/auth";
import { createShareLink, type OwnerTrip } from "../../api/trips";
import { toAbsoluteWebURL } from "../../shared/share";

type UseTripManageShareLinkParams = {
  clearOwnerSession: () => void;
  ownerAuth: AuthResponse | null;
  selectedOwnerTrip: OwnerTrip | null;
};

// 선택 여행의 공유 링크 생성, 복사, 상태 메시지를 관리한다.
export function useTripManageShareLink({
  clearOwnerSession,
  ownerAuth,
  selectedOwnerTrip,
}: UseTripManageShareLinkParams) {
  const [shareLinksByTripID, setShareLinksByTripID] = useState<Record<string, string>>({});
  const [shareLinkError, setShareLinkError] = useState("");
  const [shareLinkSubmitting, setShareLinkSubmitting] = useState(false);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const selectedShareLink = selectedOwnerTrip ? (shareLinksByTripID[selectedOwnerTrip.id] ?? "") : "";

  // 선택 여행이 바뀌면 이전 여행에서 표시하던 복사 완료/에러 상태를 지운다.
  useEffect(() => {
    setShareLinkError("");
    setShareLinkCopied(false);
  }, [selectedOwnerTrip]);

  async function createSelectedTripShareLink() {
    if (!ownerAuth || !selectedOwnerTrip) return;

    setShareLinkError("");
    setShareLinkCopied(false);
    setShareLinkSubmitting(true);
    try {
      const link = await createShareLink(ownerAuth.accessToken, selectedOwnerTrip.id);
      setShareLinksByTripID((currentLinks) => ({
        ...currentLinks,
        [selectedOwnerTrip.id]: toAbsoluteWebURL(link.webPath),
      }));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearOwnerSession();
        setShareLinkError("");
        return;
      }
      setShareLinkError(error instanceof Error ? error.message : "공유 링크를 만들지 못했습니다.");
    } finally {
      setShareLinkSubmitting(false);
    }
  }

  function copySelectedTripShareLink() {
    if (!selectedShareLink) return;
    if (!navigator.clipboard?.writeText) {
      setShareLinkCopied(false);
      setShareLinkError("이 브라우저에서는 자동 복사를 지원하지 않습니다. 링크를 직접 선택해 복사해주세요.");
      return;
    }

    navigator.clipboard
      .writeText(selectedShareLink)
      .then(() => {
        setShareLinkError("");
        setShareLinkCopied(true);
      })
      .catch(() => {
        setShareLinkCopied(false);
        setShareLinkError("자동 복사에 실패했습니다. 링크를 직접 선택해 복사해주세요.");
      });
  }

  function resetShareLinkState() {
    setShareLinksByTripID({});
    setShareLinkError("");
    setShareLinkCopied(false);
  }

  return {
    copySelectedTripShareLink,
    createSelectedTripShareLink,
    resetShareLinkState,
    selectedShareLink,
    shareLinkCopied,
    shareLinkError,
    shareLinkSubmitting,
  };
}
