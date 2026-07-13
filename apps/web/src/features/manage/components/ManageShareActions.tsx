import { CalendarDays, Copy, ExternalLink, MapPin, Plane } from "lucide-react";
import type { TripManagePageProps } from "../manageTypes";

type ManageShareActionsProps = Pick<
  TripManagePageProps,
  | "onCopyShareLink"
  | "onCreateShareLink"
  | "selectedShareLink"
  | "shareLinkCopied"
  | "shareLinkError"
  | "shareLinkSubmitting"
>;

// 선택된 여행의 연결 상태와 읽기 전용 공유 링크 생성/복사 UI만 담당한다.
// 상세 편집 흐름에서는 마지막 단계로 배치해 입력 완료 후 공유하도록 유도한다.
export function ManageShareActions({
  onCopyShareLink,
  onCreateShareLink,
  selectedShareLink,
  shareLinkCopied,
  shareLinkError,
  shareLinkSubmitting,
}: ManageShareActionsProps) {
  return (
    <section className="owner-linked-data-section share-step-section">
      <div className="section-title-row compact-title-row">
        <div>
          <h3>공유 링크</h3>
          <p className="section-caption">입력한 여행 정보를 가족이나 동행자에게 읽기 전용으로 공유합니다.</p>
        </div>
      </div>

      <div className="owner-action-grid">
        <button className="quick-button" disabled type="button">
          <CalendarDays size={18} />
          일정 조회 연결됨
        </button>
        <button className="quick-button" disabled type="button">
          <MapPin size={18} />
          장소 조회 연결됨
        </button>
        <button className="quick-button" disabled type="button">
          <Plane size={18} />
          항공 조회 연결됨
        </button>
        <button className="quick-button" disabled={shareLinkSubmitting} onClick={onCreateShareLink} type="button">
          <Copy size={18} />
          {shareLinkSubmitting
            ? "공유 링크 만드는 중"
            : selectedShareLink
              ? "새 공유 링크 만들기"
              : "읽기 전용 공유 링크 만들기"}
        </button>
      </div>

      {selectedShareLink && (
        <div className="share-link-panel">
          <label>
            공유 링크
            <input readOnly value={selectedShareLink} />
          </label>
          <div className="share-link-actions">
            <button className="secondary-button compact-button" onClick={onCopyShareLink} type="button">
              <Copy size={16} />
              링크 복사
            </button>
            <a className="secondary-button compact-button" href={selectedShareLink} rel="noreferrer" target="_blank">
              <ExternalLink size={16} />
              열기
            </a>
          </div>
        </div>
      )}

      {shareLinkCopied && <p className="form-success">공유 링크를 복사했습니다.</p>}
      {shareLinkError && <p className="form-error">{shareLinkError}</p>}
    </section>
  );
}
