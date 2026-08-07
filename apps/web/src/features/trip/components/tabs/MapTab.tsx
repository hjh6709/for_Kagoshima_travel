import { useState } from "react";
import { AlertTriangle, CalendarDays, CheckCircle2, ChevronRight, MapPin, Train } from "lucide-react";
import { PlaceDetailSheet } from "../../../../shared/components/PlaceDetailSheet";
import { TravelMap } from "../../../../shared/components/TravelMap";
import { formatKoreanDate } from "../../../../shared/date";
import { placeCategoryLabels } from "../../../../shared/travelOptions";
import type { Place, ScheduleItem } from "../../../../types/travel";
import type { TripPageProps } from "../../tripPageTypes";
import { ProfileShortcutButton } from "../cards/ProfileShortcutButton";

type RouteItem = {
  place: Place;
  schedule: ScheduleItem;
};

function PlaceEssentials({ place }: { place: Place }) {
  const displayAddress = place.chineseAddress || place.address;
  const hasCoords = place.latitude !== undefined && place.longitude !== undefined;

  return (
    <>
      {(place.subwayExit || displayAddress) && (
        <div className="map-place-essentials">
          {place.subwayExit && (
            <p>
              <Train aria-hidden="true" size={15} />
              {place.subwayExit}
            </p>
          )}
          {displayAddress && (
            <p>
              <MapPin aria-hidden="true" size={15} />
              {displayAddress}
            </p>
          )}
        </div>
      )}
      {!hasCoords && (
        <div className="place-location-warning" role="status">
          <AlertTriangle aria-hidden="true" size={15} />
          <span>정확한 위치가 없어 장소 이름과 주소로 검색합니다.</span>
        </div>
      )}
    </>
  );
}

export function MapTab({
  completedSchedules,
  editPlacesHref,
  editSchedulesHref,
  focusDate,
  focusSchedules,
  getDisplayDate,
  getPlace,
  isReadOnly,
  places,
  setActiveTab,
  setSelectedDate,
  setScheduleView,
  travelStatus,
  trip,
  onNavigateToMyPage,
}: TripPageProps) {
  const [subTab, setSubTab] = useState<"timeline" | "all">("timeline");
  const [selectedScheduleID, setSelectedScheduleID] = useState("");
  const [selectedPlaceID, setSelectedPlaceID] = useState("");
  const [sheetPlace, setSheetPlace] = useState<Place | null>(null);
  const routeLabel =
    travelStatus.phase === "before" ? "첫날 동선" : travelStatus.phase === "during" ? "오늘 동선" : "마지막 날 동선";
  const routeDate = formatKoreanDate(getDisplayDate(focusDate));

  const timelineItems: RouteItem[] = focusSchedules
    .map((schedule) => ({ schedule, place: getPlace(schedule.placeId) }))
    .filter((item): item is RouteItem => item.place !== undefined);
  const missingPlaceCount = focusSchedules.length - timelineItems.length;
  const nextRouteItem =
    travelStatus.phase === "after"
      ? undefined
      : timelineItems.find(({ schedule }) => !completedSchedules[schedule.id]);
  const selectedRouteItem =
    timelineItems.find(({ schedule }) => schedule.id === selectedScheduleID) ?? nextRouteItem ?? timelineItems[0];
  const selectedLabel =
    selectedRouteItem?.schedule.id === nextRouteItem?.schedule.id
      ? travelStatus.phase === "before"
        ? "첫 목적지"
        : "다음 목적지"
      : "선택한 정류장";
  const selectedMapPlaceID =
    selectedPlaceID ||
    (subTab === "timeline" ? selectedRouteItem?.place.id : places[0]?.id) ||
    "";

  const openSchedule = () => {
    setSelectedDate(focusDate);
    setScheduleView("itinerary");
    setActiveTab("schedule");
  };

  const selectMapPlace = (placeID: string) => {
    setSelectedPlaceID(placeID);
    const connectedRouteItem = timelineItems.find(({ place }) => place.id === placeID);
    if (connectedRouteItem) {
      setSelectedScheduleID(connectedRouteItem.schedule.id);
      setSubTab("timeline");
      return;
    }
    setSubTab("all");
  };

  return (
    <section className="screen map-screen">
      <div className="screen-title-row">
        <div>
          <h1>지도</h1>
          <p className="map-screen-intro">현재 위치와 저장한 장소를 확인하고 길찾기를 이어가세요.</p>
        </div>
        <div className="screen-title-actions">
          {editPlacesHref && places.length > 0 && (
            <a className="secondary-button compact-button" href={editPlacesHref}>장소 관리</a>
          )}
          <ProfileShortcutButton onClick={onNavigateToMyPage} />
        </div>
      </div>

      <TravelMap
        onSelectPlace={selectMapPlace}
        places={places}
        selectedPlaceID={selectedMapPlaceID}
      />

      <div className="map-segment-control" aria-label="지도 보기 방식">
        <button
          aria-pressed={subTab === "timeline"}
          className={subTab === "timeline" ? "active" : ""}
          onClick={() => {
            setSubTab("timeline");
            if (selectedRouteItem) setSelectedPlaceID(selectedRouteItem.place.id);
          }}
          type="button"
        >
          동선 길찾기
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
        timelineItems.length === 0 ? (
          <article className="empty-state-card list-card map-empty-state">
            <MapPin aria-hidden="true" size={24} />
            <div>
              <strong>{focusSchedules.length > 0 ? "일정에 연결된 장소가 없습니다" : `${routeLabel}이 비어 있습니다`}</strong>
              <p>
                {focusSchedules.length > 0
                  ? isReadOnly
                    ? "공유된 일정에 연결된 장소 정보가 없습니다."
                    : "여행 관리에서 각 일정에 장소를 연결해 주세요."
                  : isReadOnly
                    ? "이 날짜에는 공유된 일정과 장소가 없습니다."
                    : "일정을 추가하고 장소를 연결하면 길찾기 동선이 만들어집니다."}
              </p>
              {isReadOnly ? (
                <button className="secondary-button compact-button" onClick={openSchedule} type="button">
                  일정 보기
                </button>
              ) : places.length === 0 && editPlacesHref ? (
                <a className="primary-button compact-button" href={editPlacesHref}>장소 추가</a>
              ) : editSchedulesHref ? (
                <a className="primary-button compact-button" href={editSchedulesHref}>일정 추가</a>
              ) : (
                <button className="secondary-button compact-button" onClick={openSchedule} type="button">
                  일정 보기
                </button>
              )}
            </div>
          </article>
        ) : (
          <>
            {selectedRouteItem && (
              <article className="map-destination-panel">
                <div className="map-destination-heading">
                  <div>
                    <span className="map-destination-kicker">
                      <MapPin aria-hidden="true" size={14} />
                      {selectedLabel}
                    </span>
                    <h2>{selectedRouteItem.place.name}</h2>
                    {selectedRouteItem.place.chineseName && (
                      <p className="map-local-name">{selectedRouteItem.place.chineseName}</p>
                    )}
                  </div>
                  <span className="map-destination-time">{selectedRouteItem.schedule.time}</span>
                </div>

                <PlaceEssentials place={selectedRouteItem.place} />

                <button
                  aria-label={`${selectedRouteItem.place.name} 상세 보기`}
                  className="primary-button map-destination-open"
                  onClick={() => setSheetPlace(selectedRouteItem.place)}
                  type="button"
                >
                  길찾기와 주소 보기
                </button>
              </article>
            )}

            <section className="map-route-overview" aria-labelledby="map-route-title">
              <div className="map-route-heading">
                <div>
                  <span className="map-route-date">
                    <CalendarDays aria-hidden="true" size={15} />
                    {routeDate}
                  </span>
                  <h2 id="map-route-title">{routeLabel}</h2>
                  <p>
                    {timelineItems.length}개 정류장
                    {missingPlaceCount > 0 && ` · 장소 연결 필요 ${missingPlaceCount}개`}
                  </p>
                </div>
                {isReadOnly || !editSchedulesHref ? (
                  <button className="secondary-button compact-button" onClick={openSchedule} type="button">
                    일정 보기
                  </button>
                ) : (
                  <a className="secondary-button compact-button" href={editSchedulesHref}>일정 관리</a>
                )}
              </div>

              <ol className="map-stop-list">
                {timelineItems.map(({ place, schedule }, index) => {
                  const isSelected = selectedRouteItem?.schedule.id === schedule.id;
                  const isCompleted = Boolean(completedSchedules[schedule.id]);
                  return (
                    <li className="map-stop" key={schedule.id}>
                      <button
                        aria-pressed={isSelected}
                        className={`map-stop-button${isSelected ? " selected" : ""}${isCompleted ? " completed" : ""}`}
                        onClick={() => {
                          setSelectedScheduleID(schedule.id);
                          setSelectedPlaceID(place.id);
                        }}
                        type="button"
                      >
                        <span className="map-stop-index" aria-hidden="true">
                          {isCompleted ? <CheckCircle2 size={17} /> : index + 1}
                        </span>
                        <span className="map-stop-copy">
                          <small>
                            {schedule.time} · {placeCategoryLabels[place.category]}
                          </small>
                          <strong>{place.name}</strong>
                        </span>
                        {isSelected && <span className="map-stop-selected-label">선택됨</span>}
                      </button>
                      {index < timelineItems.length - 1 && (
                        <div className="map-route-leg">
                          <span aria-hidden="true" />
                          {schedule.transportMemo && <small>{schedule.transportMemo}</small>}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          </>
        )
      ) : (
        <section className="map-saved-section" aria-labelledby="map-saved-title">
          <div className="map-saved-heading">
            <h2 id="map-saved-title">저장한 장소</h2>
            <p>장소를 누르면 주소와 길찾기를 볼 수 있어요.</p>
          </div>
          {places.length === 0 ? (
            <article className="empty-state-card list-card map-empty-state">
              <MapPin aria-hidden="true" size={24} />
              <div>
                <strong>저장한 장소가 없습니다</strong>
                <p>{isReadOnly ? "여행 관리자가 장소를 추가하면 여기에 표시됩니다." : "편집 화면에서 카페, 식당, 관광지를 검색해 추가해 보세요."}</p>
                {editPlacesHref && (
                  <a className="primary-button compact-button" href={editPlacesHref}>장소 추가</a>
                )}
              </div>
            </article>
          ) : (
            <div className="map-saved-list">
              {places.map((place) => (
                <button
                  aria-label={`${place.name} 상세 보기`}
                  className="map-saved-place"
                  key={place.id}
                  onClick={() => setSheetPlace(place)}
                  type="button"
                >
                  <span className="map-saved-marker" aria-hidden="true">
                    <MapPin size={15} />
                  </span>
                  <span className="map-saved-copy">
                    <small>{placeCategoryLabels[place.category]}</small>
                    <strong>{place.name}</strong>
                    <span className="map-saved-sub">
                      {[place.chineseName, place.subwayExit || place.address].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <ChevronRight aria-hidden="true" size={18} />
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {sheetPlace && (
        <PlaceDetailSheet
          destinationCountry={trip.destinationCountry}
          onClose={() => setSheetPlace(null)}
          place={sheetPlace}
        />
      )}
    </section>
  );
}
