import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CalendarDays, Check, Copy, MapPin, Maximize2, Train, X } from "lucide-react";
import { MapDirectionsChoice } from "../../../../shared/components/MapDirectionsChoice";
import { formatKoreanDate } from "../../../../shared/date";
import { placeCategoryLabels } from "../../../../shared/travelOptions";
import type { Place } from "../../../../types/travel";
import type { TripPageProps } from "../../tripPageTypes";
import { ProfileShortcutButton } from "../cards/ProfileShortcutButton";

type PlaceMapCardProps = {
  copied: boolean;
  destinationCountry?: string;
  isChina: boolean;
  place: Place;
  scheduleTime?: string;
  showReason?: boolean;
  warningText: string;
  onCopyAddress: (placeID: string, address: string) => void;
  onShowPhrase: (title: string, address: string) => void;
};

function PlaceMapCard({
  copied,
  destinationCountry,
  isChina,
  place,
  scheduleTime,
  showReason = true,
  warningText,
  onCopyAddress,
  onShowPhrase,
}: PlaceMapCardProps) {
  const displayAddress = place.chineseAddress || place.address || "";
  const hasCoords = place.latitude !== undefined && place.longitude !== undefined;

  return (
    <article className="place-card map-place-card">
      <div className="place-card-marker" aria-hidden="true">
        <MapPin size={16} />
      </div>

      <div className="place-card-body">
        <div className="place-card-meta">
          <span className="pill subtle">{placeCategoryLabels[place.category]}</span>
          {scheduleTime && <span className="pill route-time-pill">{scheduleTime}</span>}
        </div>

        <h2>{place.name}</h2>
        {place.chineseName && <p className="place-local-name">{place.chineseName}</p>}
        {showReason && place.recommendedReason && <p className="place-reason">{place.recommendedReason}</p>}

        <div className="place-address-list">
          {place.address && (
            <p>
              <span>주소</span>
              {place.address}
            </p>
          )}
          {place.chineseAddress && (
            <p>
              <span>현지 주소</span>
              {place.chineseAddress}
            </p>
          )}
          {place.subwayExit && (
            <p className="place-transit">
              <Train aria-hidden="true" size={14} />
              {place.subwayExit}
            </p>
          )}
        </div>

        {!hasCoords && (
          <div className="place-location-warning" role="status">
            <AlertTriangle aria-hidden="true" size={15} />
            <span>{warningText}</span>
          </div>
        )}

        <div className="place-card-actions">
          <MapDirectionsChoice destinationCountry={destinationCountry} place={place} />
          <div className="place-card-utilities">
            {displayAddress && (
              <button
                aria-label={copied ? `${place.name} 주소 복사 완료` : `${place.name} 주소 복사`}
                className="secondary-button compact-button icon-only-button"
                onClick={() => onCopyAddress(place.id, displayAddress)}
                title={copied ? "주소 복사 완료" : "주소 복사"}
                type="button"
              >
                {copied ? <Check aria-hidden="true" size={16} /> : <Copy aria-hidden="true" size={16} />}
              </button>
            )}
            {isChina && (place.chineseName || place.name) && (
              <button
                aria-label={`${place.name}을 기사님께 크게 보여주기`}
                className="secondary-button compact-button icon-only-button"
                onClick={() =>
                  onShowPhrase(
                    place.chineseName || place.name,
                    place.chineseAddress || place.address || "주소 정보 없음",
                  )
                }
                title="기사님께 크게 보여주기"
                type="button"
              >
                <Maximize2 aria-hidden="true" size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export function MapTab({
  focusDate,
  focusSchedules,
  getDisplayDate,
  getPlace,
  places,
  setActiveTab,
  setScheduleView,
  travelStatus,
  trip,
  onNavigateToMyPage,
}: TripPageProps) {
  const [subTab, setSubTab] = useState<"timeline" | "all">("timeline");
  const [copiedPlaceID, setCopiedPlaceID] = useState("");
  const [copyError, setCopyError] = useState("");
  const [phraseModal, setPhraseModal] = useState({ open: false, title: "", address: "" });
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isChina = trip.destinationCountry === "CN";
  const routeLabel =
    travelStatus.phase === "before" ? "첫날 동선" : travelStatus.phase === "during" ? "오늘 동선" : "마지막 날 동선";
  const routeDate = formatKoreanDate(getDisplayDate(focusDate));

  useEffect(() => {
    if (!phraseModal.open) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPhraseModal({ open: false, title: "", address: "" });
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("button, [href], [tabindex]:not([tabindex='-1'])"));
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [phraseModal.open]);

  const handleCopyAddress = async (placeID: string, address: string) => {
    if (!navigator.clipboard) {
      setCopyError("이 브라우저에서는 주소 복사를 지원하지 않습니다. 주소를 길게 눌러 직접 복사해 주세요.");
      return;
    }
    try {
      await navigator.clipboard.writeText(address);
      setCopyError("");
      setCopiedPlaceID(placeID);
      window.setTimeout(() => setCopiedPlaceID(""), 2000);
    } catch {
      setCopiedPlaceID("");
      setCopyError("주소를 복사하지 못했습니다. 주소를 길게 눌러 직접 복사해 주세요.");
    }
  };

  const timelineItems = focusSchedules
    .map((schedule) => ({ schedule, place: getPlace(schedule.placeId) }))
    .filter((item): item is typeof item & { place: Place } => item.place !== undefined);
  const missingPlaceCount = focusSchedules.length - timelineItems.length;

  return (
    <section className="screen map-screen">
      <div className="screen-title-row">
        <div>
          <h1>동선과 길찾기</h1>
          <p className="map-screen-intro">일정에 연결한 장소를 이동 순서대로 확인하세요.</p>
        </div>
        <ProfileShortcutButton onClick={onNavigateToMyPage} />
      </div>

      <div className="map-segment-control" aria-label="지도 보기 방식">
        <button
          aria-pressed={subTab === "timeline"}
          className={subTab === "timeline" ? "active" : ""}
          onClick={() => setSubTab("timeline")}
          type="button"
        >
          {routeLabel}
        </button>
        <button
          aria-pressed={subTab === "all"}
          className={subTab === "all" ? "active" : ""}
          onClick={() => setSubTab("all")}
          type="button"
        >
          저장한 장소 <span>{places.length}</span>
        </button>
      </div>

      {subTab === "timeline" ? (
        <>
          <div className="map-route-summary">
            <CalendarDays aria-hidden="true" size={19} />
            <div>
              <strong>{routeDate}</strong>
              <p>
                {focusSchedules.length === 0
                  ? "등록된 일정이 없습니다."
                  : `장소 연결 ${timelineItems.length}/${focusSchedules.length}${
                      missingPlaceCount > 0
                        ? ` · ${missingPlaceCount}개 일정은 장소 연결이 필요해요.`
                        : " · 순서대로 길찾기를 시작하세요."
                    }`}
              </p>
            </div>
            <button
              className="secondary-button compact-button"
              onClick={() => {
                setScheduleView("itinerary");
                setActiveTab("schedule");
              }}
              type="button"
            >
              일정 보기
            </button>
          </div>
          <div className="map-route-list">
          {timelineItems.length === 0 ? (
            <article className="empty-state-card list-card map-empty-state">
              <MapPin aria-hidden="true" size={24} />
              <div>
                <strong>{focusSchedules.length > 0 ? "일정에 연결된 장소가 없습니다" : `${routeLabel}이 비어 있습니다`}</strong>
                <p>
                  {focusSchedules.length > 0
                    ? "여행 관리에서 각 일정에 장소를 연결해 주세요."
                    : "일정을 추가하고 장소를 연결하면 이동 순서대로 나타납니다."}
                </p>
              </div>
            </article>
          ) : (
            timelineItems.map(({ place, schedule }, index) => (
              <div className="map-route-stop" key={schedule.id}>
                <PlaceMapCard
                  copied={copiedPlaceID === place.id}
                  destinationCountry={trip.destinationCountry}
                  isChina={isChina}
                  onCopyAddress={(placeID, address) => void handleCopyAddress(placeID, address)}
                  onShowPhrase={(title, address) => setPhraseModal({ open: true, title, address })}
                  place={place}
                  scheduleTime={schedule.time}
                  showReason={false}
                  warningText="정확한 위치가 없어 이름으로 검색합니다."
                />
                {index < timelineItems.length - 1 && (
                  <div className="timeline-connector">
                    <div className="timeline-line" />
                    {schedule.transportMemo && <span className="timeline-arrow">{schedule.transportMemo}</span>}
                  </div>
                )}
              </div>
            ))
          )}
          </div>
        </>
      ) : (
        <div className="card-stack map-all-places">
          {places.length === 0 ? (
            <article className="empty-state-card list-card map-empty-state">
              <MapPin aria-hidden="true" size={24} />
              <div>
                <strong>저장한 장소가 없습니다</strong>
                <p>편집 화면에서 카페, 식당, 관광지를 검색해 추가해 보세요.</p>
              </div>
            </article>
          ) : (
            places.map((place) => (
              <PlaceMapCard
                copied={copiedPlaceID === place.id}
                destinationCountry={trip.destinationCountry}
                isChina={isChina}
                key={place.id}
                onCopyAddress={(placeID, address) => void handleCopyAddress(placeID, address)}
                onShowPhrase={(title, address) => setPhraseModal({ open: true, title, address })}
                place={place}
                warningText="정확한 위치가 없어 이름으로 검색합니다."
              />
            ))
          )}
        </div>
      )}

      {copyError && (
        <p className="map-copy-error" role="alert">
          {copyError}
        </p>
      )}

      {phraseModal.open && (
        <div
          className="taxi-phrase-overlay"
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="기사님께 보여줄 장소"
        >
          <div className="taxi-phrase-header">
            <button
              aria-label="크게 보기 닫기"
              className="taxi-phrase-close"
              ref={closeButtonRef}
              onClick={() => setPhraseModal({ open: false, title: "", address: "" })}
              type="button"
            >
              <X aria-hidden="true" size={20} />
            </button>
          </div>

          <div className="taxi-phrase-content">
            <p className="taxi-phrase-label">택시 기사님께 보여주세요</p>
            <h2 className="taxi-phrase-title">{phraseModal.title}</h2>
            <p className="taxi-phrase-label taxi-address-label">현지 주소</p>
            <p className="taxi-phrase-address">{phraseModal.address}</p>
          </div>
        </div>
      )}
    </section>
  );
}
