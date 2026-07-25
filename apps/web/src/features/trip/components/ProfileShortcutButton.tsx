import { User } from "lucide-react";

type ProfileShortcutButtonProps = {
  onClick?: () => void;
};

export function ProfileShortcutButton({ onClick }: ProfileShortcutButtonProps) {
  if (!onClick) return null;

  return (
    <button
      aria-label="마이페이지 열기"
      className="header-profile-btn"
      onClick={onClick}
      title="마이페이지 열기"
      type="button"
    >
      <User aria-hidden="true" size={20} />
    </button>
  );
}
