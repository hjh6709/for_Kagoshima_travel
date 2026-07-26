import { useCallback, useEffect, useRef, useState } from "react";
import { applyPwaUpdate, subscribePwaStatus, type PwaStatus } from "../pwaStatus";
import { ToastNotification, type ToastMessage } from "./ToastNotification";

type StatusNotice = {
  toast: ToastMessage;
  duration: number;
  actionLabel?: string;
  onAction?: () => void;
};

const NETWORK_OFFLINE_NOTICE: StatusNotice = {
  toast: {
    id: "network-offline",
    type: "warning",
    title: "인터넷 연결이 끊겼습니다",
    message: "저장된 화면은 볼 수 있지만 검색과 변경 내용 저장은 연결 후 이용해 주세요.",
  },
  duration: 0,
};

function noticeForPwaStatus(status: PwaStatus): StatusNotice {
  switch (status) {
    case "update-ready":
      return {
        toast: {
          id: status,
          type: "info",
          title: "새 버전을 사용할 수 있습니다",
          message: "업데이트하면 최신 기능과 수정 사항이 바로 적용됩니다.",
        },
        duration: 0,
        actionLabel: "지금 업데이트",
        onAction: () => void applyPwaUpdate(),
      };
    case "register-error":
      return {
        toast: {
          id: status,
          type: "error",
          title: "오프라인 기능을 준비하지 못했습니다",
          message: "인터넷 연결을 확인한 뒤 페이지를 다시 열어 주세요.",
        },
        duration: 5000,
      };
    case "offline-ready":
      return {
        toast: {
          id: status,
          type: "success",
          title: "오프라인 사용 준비 완료",
          message: "연결이 불안정해도 최근에 연 화면을 다시 볼 수 있습니다.",
        },
        duration: 4500,
      };
  }
}

export function PwaStatusBanner() {
  const [notice, setNotice] = useState<StatusNotice | null>(() =>
    navigator.onLine ? null : NETWORK_OFFLINE_NOTICE,
  );
  const wasOffline = useRef(!navigator.onLine);

  useEffect(() => {
    return subscribePwaStatus((status) => {
      if (!navigator.onLine && status === "offline-ready") return;
      setNotice(noticeForPwaStatus(status));
    });
  }, []);

  useEffect(() => {
    const handleOffline = () => {
      wasOffline.current = true;
      setNotice(NETWORK_OFFLINE_NOTICE);
    };

    const handleOnline = () => {
      if (!wasOffline.current) return;
      wasOffline.current = false;
      setNotice({
        toast: {
          id: `network-restored-${Date.now()}`,
          type: "success",
          title: "인터넷에 다시 연결되었습니다",
          message: "검색과 저장 기능을 다시 사용할 수 있습니다.",
        },
        duration: 3500,
      });
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const closeNotice = useCallback(() => setNotice(null), []);

  return (
    <ToastNotification
      toast={notice?.toast ?? null}
      duration={notice?.duration}
      actionLabel={notice?.actionLabel}
      onAction={notice?.onAction}
      onClose={closeNotice}
      placement="bottom"
    />
  );
}
