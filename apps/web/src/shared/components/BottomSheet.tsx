import { useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { useDialogFocusTrap } from "../useDialogFocusTrap";

type BottomSheetProps = {
  ariaLabel: string;
  children: ReactNode;
  onClose: () => void;
};

// 장소 상세와 현지 도구가 함께 쓰는 바텀 시트 껍데기.
// 딤 · 그랩 핸들 · 포커스 트랩 · 닫기 버튼을 한곳에서 책임진다.
export function BottomSheet({ ariaLabel, children, onClose }: BottomSheetProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  useDialogFocusTrap({ dialogRef, initialFocusRef: closeButtonRef, isOpen: true, onClose });

  return (
    <div className="place-sheet-backdrop">
      <div aria-label={ariaLabel} aria-modal="true" className="place-sheet" ref={dialogRef} role="dialog">
        <span aria-hidden="true" className="place-sheet-handle" />
        {children}
        <button className="place-sheet-close" onClick={onClose} ref={closeButtonRef} type="button">
          <X aria-hidden="true" size={16} />
          닫기
        </button>
      </div>
    </div>
  );
}
