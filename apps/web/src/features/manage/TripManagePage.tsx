import {
  CalendarDays,
  CheckCircle2,
  Copy,
  ExternalLink,
  LockKeyhole,
  LogOut,
  MapPin,
  Plane,
  PlusCircle,
  Trash2,
  UserRound,
} from "lucide-react";
import { useMemo, type FormEvent } from "react";
import type { AuthResponse } from "../../api/auth";
import type { OwnerTrip, SharedFlight, SharedPlace, SharedSchedule } from "../../api/trips";
import { formatKoreanDate } from "../../shared/date";
import {
  flightDirectionOptions,
  getFlightDirectionLabel,
  getScheduleTypeLabel,
  placeCategoryLabels,
  placeCategoryOptions,
  scheduleTypeOptions,
  type FlightDirection,
} from "../../shared/travelOptions";
import type { PlaceCategory, ScheduleItem } from "../../types/travel";

export type AuthMode = "login" | "register";

// App.tsx owns routing, API calls, and session state. This component stays presentational
// so the travel management UI can be split into smaller sections without changing behavior.
type TripManagePageProps = {
  auth: AuthResponse | null;
  authChecked: boolean;
  authEmail: string;
  authError: string;
  authMode: AuthMode;
  authPassword: string;
  authSubmitting: boolean;
  newTripEndDate: string;
  newTripMemo: string;
  newTripStartDate: string;
  newTripTitle: string;
  newTripTravelers: string;
  newScheduleDate: string;
  newScheduleGuideMemo: string;
  newSchedulePlaceID: string;
  newScheduleTime: string;
  newScheduleTitle: string;
  newScheduleTransportMemo: string;
  newScheduleType: ScheduleItem["type"];
  newPlaceAddress: string;
  newPlaceCategory: PlaceCategory;
  newPlaceGoogleMapsURL: string;
  newPlaceName: string;
  newPlaceRecommendedReason: string;
  newFlightAirline: string;
  newFlightArrivalAirport: string;
  newFlightArrivalDate: string;
  newFlightArrivalTime: string;
  newFlightDepartureAirport: string;
  newFlightDepartureDate: string;
  newFlightDepartureTime: string;
  newFlightDirection: FlightDirection;
  newFlightLabel: string;
  newFlightMemo: string;
  newFlightNumber: string;
  ownerTrips: OwnerTrip[];
  ownerTripsError: string;
  ownerTripsLoading: boolean;
  ownerSchedules: SharedSchedule[];
  ownerPlaces: SharedPlace[];
  ownerFlights: SharedFlight[];
  ownerDetailDataError: string;
  ownerDetailDataLoading: boolean;
  isScheduleListEditing: boolean;
  deletingScheduleID: string;
  isPlaceListEditing: boolean;
  deletingPlaceID: string;
  selectedOwnerTrip: OwnerTrip | null;
  selectedShareLink: string;
  flightCreateError: string;
  flightCreateSubmitting: boolean;
  placeCreateError: string;
  placeCreateSubmitting: boolean;
  placeDeleteError: string;
  scheduleCreateError: string;
  scheduleCreateSubmitting: boolean;
  scheduleDeleteError: string;
  shareLinkCopied: boolean;
  shareLinkError: string;
  shareLinkSubmitting: boolean;
  tripCreateError: string;
  tripCreateSubmitting: boolean;
  tripEditEndDate: string;
  tripEditError: string;
  tripEditMemo: string;
  tripEditStartDate: string;
  tripEditSubmitting: boolean;
  tripEditTitle: string;
  tripEditTravelers: string;
  onAuthEmailChange: (value: string) => void;
  onAuthModeChange: (mode: AuthMode) => void;
  onAuthPasswordChange: (value: string) => void;
  onNewTripEndDateChange: (value: string) => void;
  onNewTripMemoChange: (value: string) => void;
  onNewTripStartDateChange: (value: string) => void;
  onNewTripTitleChange: (value: string) => void;
  onNewTripTravelersChange: (value: string) => void;
  onNewScheduleDateChange: (value: string) => void;
  onNewScheduleGuideMemoChange: (value: string) => void;
  onNewSchedulePlaceIDChange: (value: string) => void;
  onNewScheduleTimeChange: (value: string) => void;
  onNewScheduleTitleChange: (value: string) => void;
  onNewScheduleTransportMemoChange: (value: string) => void;
  onNewScheduleTypeChange: (value: ScheduleItem["type"]) => void;
  onNewPlaceAddressChange: (value: string) => void;
  onNewPlaceCategoryChange: (value: PlaceCategory) => void;
  onNewPlaceGoogleMapsURLChange: (value: string) => void;
  onNewPlaceNameChange: (value: string) => void;
  onNewPlaceRecommendedReasonChange: (value: string) => void;
  onNewFlightAirlineChange: (value: string) => void;
  onNewFlightArrivalAirportChange: (value: string) => void;
  onNewFlightArrivalDateChange: (value: string) => void;
  onNewFlightArrivalTimeChange: (value: string) => void;
  onNewFlightDepartureAirportChange: (value: string) => void;
  onNewFlightDepartureDateChange: (value: string) => void;
  onNewFlightDepartureTimeChange: (value: string) => void;
  onNewFlightDirectionChange: (value: FlightDirection) => void;
  onNewFlightLabelChange: (value: string) => void;
  onNewFlightMemoChange: (value: string) => void;
  onNewFlightNumberChange: (value: string) => void;
  onCloseOwnerTripDetail: () => void;
  onCopyShareLink: () => void;
  onCreateShareLink: () => void;
  onDeleteSchedule: (scheduleID: string) => void;
  onScheduleListEditingChange: (value: boolean) => void;
  onDeletePlace: (placeID: string) => void;
  onPlaceListEditingChange: (value: boolean) => void;
  onTripEditEndDateChange: (value: string) => void;
  onTripEditMemoChange: (value: string) => void;
  onTripEditStartDateChange: (value: string) => void;
  onTripEditTitleChange: (value: string) => void;
  onTripEditTravelersChange: (value: string) => void;
  onLogout: () => void;
  onSelectOwnerTrip: (tripID: string) => void;
  onSubmitAuth: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitNewFlight: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitNewPlace: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitNewTrip: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitNewSchedule: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitTripEdit: (event: FormEvent<HTMLFormElement>) => void;
};

export function TripManagePage({
  auth,
  authChecked,
  authEmail,
  authError,
  authMode,
  authPassword,
  authSubmitting,
  newTripEndDate,
  newTripMemo,
  newTripStartDate,
  newTripTitle,
  newTripTravelers,
  newScheduleDate,
  newScheduleGuideMemo,
  newSchedulePlaceID,
  newScheduleTime,
  newScheduleTitle,
  newScheduleTransportMemo,
  newScheduleType,
  newPlaceAddress,
  newPlaceCategory,
  newPlaceGoogleMapsURL,
  newPlaceName,
  newPlaceRecommendedReason,
  newFlightAirline,
  newFlightArrivalAirport,
  newFlightArrivalDate,
  newFlightArrivalTime,
  newFlightDepartureAirport,
  newFlightDepartureDate,
  newFlightDepartureTime,
  newFlightDirection,
  newFlightLabel,
  newFlightMemo,
  newFlightNumber,
  ownerTrips,
  ownerTripsError,
  ownerTripsLoading,
  ownerSchedules,
  ownerPlaces,
  ownerFlights,
  ownerDetailDataError,
  ownerDetailDataLoading,
  isScheduleListEditing,
  deletingScheduleID,
  isPlaceListEditing,
  deletingPlaceID,
  selectedOwnerTrip,
  selectedShareLink,
  flightCreateError,
  flightCreateSubmitting,
  placeCreateError,
  placeCreateSubmitting,
  placeDeleteError,
  scheduleCreateError,
  scheduleCreateSubmitting,
  scheduleDeleteError,
  shareLinkCopied,
  shareLinkError,
  shareLinkSubmitting,
  tripCreateError,
  tripCreateSubmitting,
  tripEditEndDate,
  tripEditError,
  tripEditMemo,
  tripEditStartDate,
  tripEditSubmitting,
  tripEditTitle,
  tripEditTravelers,
  onAuthEmailChange,
  onAuthModeChange,
  onAuthPasswordChange,
  onNewTripEndDateChange,
  onNewTripMemoChange,
  onNewTripStartDateChange,
  onNewTripTitleChange,
  onNewTripTravelersChange,
  onNewScheduleDateChange,
  onNewScheduleGuideMemoChange,
  onNewSchedulePlaceIDChange,
  onNewScheduleTimeChange,
  onNewScheduleTitleChange,
  onNewScheduleTransportMemoChange,
  onNewScheduleTypeChange,
  onNewPlaceAddressChange,
  onNewPlaceCategoryChange,
  onNewPlaceGoogleMapsURLChange,
  onNewPlaceNameChange,
  onNewPlaceRecommendedReasonChange,
  onNewFlightAirlineChange,
  onNewFlightArrivalAirportChange,
  onNewFlightArrivalDateChange,
  onNewFlightArrivalTimeChange,
  onNewFlightDepartureAirportChange,
  onNewFlightDepartureDateChange,
  onNewFlightDepartureTimeChange,
  onNewFlightDirectionChange,
  onNewFlightLabelChange,
  onNewFlightMemoChange,
  onNewFlightNumberChange,
  onCloseOwnerTripDetail,
  onCopyShareLink,
  onCreateShareLink,
  onDeleteSchedule,
  onScheduleListEditingChange,
  onDeletePlace,
  onPlaceListEditingChange,
  onTripEditEndDateChange,
  onTripEditMemoChange,
  onTripEditStartDateChange,
  onTripEditTitleChange,
  onTripEditTravelersChange,
  onLogout,
  onSelectOwnerTrip,
  onSubmitAuth,
  onSubmitNewFlight,
  onSubmitNewPlace,
  onSubmitNewTrip,
  onSubmitNewSchedule,
  onSubmitTripEdit,
}: TripManagePageProps) {
  const ownerPlaceByID = useMemo(() => new Map(ownerPlaces.map((place) => [place.id, place])), [ownerPlaces]);

  return (
    <main className="app-shell">
      <section className="phone-frame owner-frame">
        <div className="content">
          <section className="screen owner-screen">
            {!authChecked && (
              <article className="info-card auth-card">
                <span className="pill">여행 관리 계정</span>
                <h1>로그인 확인 중</h1>
                <p className="muted">저장된 로그인 정보를 확인하고 있습니다.</p>
              </article>
            )}

            {authChecked && !auth && (
              <article className="info-card auth-card">
                <span className="pill">여행 관리 계정</span>
                <h1>{authMode === "login" ? "여행 관리 로그인" : "여행 관리 계정 만들기"}</h1>
                <p className="muted">
                  처음 사용하는 경우 계정을 만든 뒤 여행을 생성합니다. 공유 링크를 받은 가족이나 동행자는 로그인 없이
                  읽기 전용으로 확인합니다.
                </p>

                <form className="auth-form" onSubmit={onSubmitAuth}>
                  <label>
                    이메일
                    <input
                      autoComplete="email"
                      inputMode="email"
                      onChange={(event) => onAuthEmailChange(event.target.value)}
                      placeholder="you@example.com"
                      required
                      type="email"
                      value={authEmail}
                    />
                  </label>
                  <label>
                    비밀번호
                    <input
                      autoComplete={authMode === "login" ? "current-password" : "new-password"}
                      minLength={8}
                      onChange={(event) => onAuthPasswordChange(event.target.value)}
                      placeholder="8자 이상"
                      required
                      type="password"
                      value={authPassword}
                    />
                  </label>

                  {authError && <p className="form-error">{authError}</p>}

                  <button className="primary-button" disabled={authSubmitting} type="submit">
                    <LockKeyhole size={18} />
                    {authSubmitting ? "처리 중" : authMode === "login" ? "로그인" : "회원가입"}
                  </button>
                </form>

                <button
                  className="secondary-button auth-switch-button"
                  onClick={() => onAuthModeChange(authMode === "login" ? "register" : "login")}
                  type="button"
                >
                  {authMode === "login" ? "계정이 없으면 회원가입" : "이미 계정이 있으면 로그인"}
                </button>

                <p className="auth-help">
                  로컬 개발은 <code>VITE_API_BASE_URL=http://localhost:8080</code> 설정이 필요합니다.
                </p>
              </article>
            )}

            {authChecked && auth && (
              <>
                <div className="owner-header">
                  <div>
                    <span className="eyebrow">여행 관리 계정</span>
                    <h1>여행 관리</h1>
                    <p className="muted">{auth.user.email}</p>
                  </div>
                  <button className="icon-button neutral" onClick={onLogout} type="button" aria-label="로그아웃">
                    <LogOut size={18} />
                  </button>
                </div>

                <article className="hero-card">
                  <div>
                    <span className="pill">내 여행</span>
                    <h2>관리할 여행을 선택하세요</h2>
                    <p className="muted">
                      로그인한 계정으로 여행을 만들고, 이후 일정과 장소를 연결합니다.
                    </p>
                  </div>
                  <a className="primary-button" href="/">
                    <UserRound size={18} />
                    여행 화면 보기
                  </a>
                </article>

                {selectedOwnerTrip && (
                  <section className="section-block owner-detail-section">
                    <div className="section-title-row">
                      <div>
                        <span className="pill">선택한 여행</span>
                        <h2>{selectedOwnerTrip.title}</h2>
                        <p className="section-caption">
                          {formatKoreanDate(selectedOwnerTrip.startDate)} ~ {formatKoreanDate(selectedOwnerTrip.endDate)}
                        </p>
                      </div>
                      <button className="secondary-button compact-button" onClick={onCloseOwnerTripDetail} type="button">
                        목록으로
                      </button>
                    </div>

                    <article className="owner-trip-detail-card">
                      <div className="detail-grid">
                        <div>
                          <span className="muted-label">여행자</span>
                          <p>
                            {selectedOwnerTrip.travelers.length > 0
                              ? selectedOwnerTrip.travelers.join(", ")
                              : "여행자 미입력"}
                          </p>
                        </div>
                        <div>
                          <span className="muted-label">메모</span>
                          <p>{selectedOwnerTrip.memo || "메모 없음"}</p>
                        </div>
                      </div>

                      <form className="auth-form trip-edit-form" onSubmit={onSubmitTripEdit}>
                        <div className="section-title-row compact-title-row">
                          <div>
                            <h3>기본 정보 수정</h3>
                            <p className="section-caption">여행명, 기간, 여행자, 메모를 수정합니다.</p>
                          </div>
                        </div>

                        <label>
                          여행명
                          <input
                            onChange={(event) => onTripEditTitleChange(event.target.value)}
                            required
                            type="text"
                            value={tripEditTitle}
                          />
                        </label>

                        <div className="form-grid-two">
                          <label>
                            시작일
                            <input
                              onChange={(event) => onTripEditStartDateChange(event.target.value)}
                              required
                              type="date"
                              value={tripEditStartDate}
                            />
                          </label>
                          <label>
                            종료일
                            <input
                              min={tripEditStartDate || undefined}
                              onChange={(event) => onTripEditEndDateChange(event.target.value)}
                              required
                              type="date"
                              value={tripEditEndDate}
                            />
                          </label>
                        </div>

                        <label>
                          여행자
                          <textarea
                            onChange={(event) => onTripEditTravelersChange(event.target.value)}
                            placeholder="쉼표 또는 줄바꿈으로 입력"
                            rows={3}
                            value={tripEditTravelers}
                          />
                        </label>

                        <label>
                          메모
                          <textarea
                            onChange={(event) => onTripEditMemoChange(event.target.value)}
                            placeholder="여행 목적, 주의사항, 준비 메모"
                            rows={3}
                            value={tripEditMemo}
                          />
                        </label>

                        {tripEditError && <p className="form-error">{tripEditError}</p>}

                        <button className="primary-button" disabled={tripEditSubmitting} type="submit">
                          <CheckCircle2 size={18} />
                          {tripEditSubmitting ? "저장 중" : "기본 정보 저장"}
                        </button>
                      </form>

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
                        <button
                          className="quick-button"
                          disabled={shareLinkSubmitting}
                          onClick={onCreateShareLink}
                          type="button"
                        >
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
                            <a
                              className="secondary-button compact-button"
                              href={selectedShareLink}
                              rel="noreferrer"
                              target="_blank"
                            >
                              <ExternalLink size={16} />
                              열기
                            </a>
                          </div>
                        </div>
                      )}

                      {shareLinkCopied && <p className="form-success">공유 링크를 복사했습니다.</p>}
                      {shareLinkError && <p className="form-error">{shareLinkError}</p>}

                      <section className="owner-linked-data-section">
                        <div className="section-title-row compact-title-row">
                          <div>
                            <h3>장소 추가</h3>
                            <p className="section-caption">
                              일정에 연결하거나 공유 화면에 표시할 장소를 서버에 저장합니다.
                            </p>
                          </div>
                        </div>

                        <form className="auth-form compact-owner-form" onSubmit={onSubmitNewPlace}>
                          <div className="form-grid-two">
                            <label>
                              장소 이름
                              <input
                                onChange={(event) => onNewPlaceNameChange(event.target.value)}
                                placeholder="예: 공항 렌터카 센터"
                                required
                                type="text"
                                value={newPlaceName}
                              />
                            </label>
                            <label>
                              분류
                              <select
                                onChange={(event) => onNewPlaceCategoryChange(event.target.value as PlaceCategory)}
                                value={newPlaceCategory}
                              >
                                {placeCategoryOptions.map(([category, label]) => (
                                  <option key={category} value={category}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>

                          <label>
                            주소
                            <input
                              onChange={(event) => onNewPlaceAddressChange(event.target.value)}
                              placeholder="예: 공항 1층 또는 숙소 주소"
                              type="text"
                              value={newPlaceAddress}
                            />
                          </label>

                          <label>
                            Google Maps 링크
                            <input
                              inputMode="url"
                              onChange={(event) => onNewPlaceGoogleMapsURLChange(event.target.value)}
                              placeholder="https://www.google.com/maps/..."
                              type="url"
                              value={newPlaceGoogleMapsURL}
                            />
                          </label>

                          <label>
                            추천/안내 메모
                            <textarea
                              onChange={(event) => onNewPlaceRecommendedReasonChange(event.target.value)}
                              placeholder="예: 도착 후 바로 이동할 장소, 운영시간 확인 필요"
                              rows={2}
                              value={newPlaceRecommendedReason}
                            />
                          </label>

                          {placeCreateError && <p className="form-error">{placeCreateError}</p>}

                          <button className="primary-button" disabled={placeCreateSubmitting} type="submit">
                            <PlusCircle size={18} />
                            {placeCreateSubmitting ? "장소 추가 중" : "장소 추가"}
                          </button>
                        </form>
                      </section>

                      <section className="owner-linked-data-section">
                        <div className="section-title-row compact-title-row">
                          <div>
                            <h3>항공편 추가</h3>
                            <p className="section-caption">공유 화면 항공 정보에 표시할 항공편을 서버에 저장합니다.</p>
                          </div>
                        </div>

                        <form className="auth-form compact-owner-form" onSubmit={onSubmitNewFlight}>
                          <div className="form-grid-two">
                            <label>
                              구분
                              <select
                                onChange={(event) => onNewFlightDirectionChange(event.target.value as FlightDirection)}
                                value={newFlightDirection}
                              >
                                {flightDirectionOptions.map(([direction, label]) => (
                                  <option key={direction} value={direction}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label>
                              항공편 이름
                              <input
                                onChange={(event) => onNewFlightLabelChange(event.target.value)}
                                placeholder="예: 출국 항공편"
                                required
                                type="text"
                                value={newFlightLabel}
                              />
                            </label>
                          </div>

                          <div className="form-grid-two">
                            <label>
                              항공사
                              <input
                                onChange={(event) => onNewFlightAirlineChange(event.target.value)}
                                placeholder="예: 대한항공"
                                type="text"
                                value={newFlightAirline}
                              />
                            </label>
                            <label>
                              편명
                              <input
                                autoCapitalize="characters"
                                onChange={(event) => onNewFlightNumberChange(event.target.value)}
                                placeholder="예: KE123"
                                type="text"
                                value={newFlightNumber}
                              />
                            </label>
                          </div>

                          <div className="form-grid-two">
                            <label>
                              출발 공항
                              <input
                                onChange={(event) => onNewFlightDepartureAirportChange(event.target.value)}
                                placeholder="예: 인천"
                                required
                                type="text"
                                value={newFlightDepartureAirport}
                              />
                            </label>
                            <label>
                              도착 공항
                              <input
                                onChange={(event) => onNewFlightArrivalAirportChange(event.target.value)}
                                placeholder="예: 도쿄"
                                required
                                type="text"
                                value={newFlightArrivalAirport}
                              />
                            </label>
                          </div>

                          <div className="form-grid-two">
                            <label>
                              출발 날짜
                              <input
                                max={selectedOwnerTrip.endDate}
                                min={selectedOwnerTrip.startDate}
                                onChange={(event) => onNewFlightDepartureDateChange(event.target.value)}
                                required
                                type="date"
                                value={newFlightDepartureDate}
                              />
                            </label>
                            <label>
                              출발 시간
                              <input
                                onChange={(event) => onNewFlightDepartureTimeChange(event.target.value)}
                                placeholder="예: 10:30"
                                required
                                type="text"
                                value={newFlightDepartureTime}
                              />
                            </label>
                          </div>

                          <div className="form-grid-two">
                            <label>
                              도착 날짜
                              <input
                                min={newFlightDepartureDate || selectedOwnerTrip.startDate}
                                onChange={(event) => onNewFlightArrivalDateChange(event.target.value)}
                                type="date"
                                value={newFlightArrivalDate}
                              />
                            </label>
                            <label>
                              도착 시간
                              <input
                                onChange={(event) => onNewFlightArrivalTimeChange(event.target.value)}
                                placeholder="예: 12:45"
                                type="text"
                                value={newFlightArrivalTime}
                              />
                            </label>
                          </div>

                          <label>
                            항공 메모
                            <textarea
                              onChange={(event) => onNewFlightMemoChange(event.target.value)}
                              placeholder="예: 터미널, 수하물, 체크인 주의사항"
                              rows={2}
                              value={newFlightMemo}
                            />
                          </label>

                          {flightCreateError && <p className="form-error">{flightCreateError}</p>}

                          <button className="primary-button" disabled={flightCreateSubmitting} type="submit">
                            <PlusCircle size={18} />
                            {flightCreateSubmitting ? "항공편 추가 중" : "항공편 추가"}
                          </button>
                        </form>
                      </section>

                      <section className="owner-linked-data-section">
                        <div className="section-title-row compact-title-row">
                          <div>
                            <h3>일정 추가</h3>
                            <p className="section-caption">공유 화면에 표시할 일정을 서버에 저장합니다.</p>
                          </div>
                        </div>

                        <form className="auth-form compact-owner-form" onSubmit={onSubmitNewSchedule}>
                          <div className="form-grid-two">
                            <label>
                              날짜
                              <input
                                max={selectedOwnerTrip.endDate}
                                min={selectedOwnerTrip.startDate}
                                onChange={(event) => onNewScheduleDateChange(event.target.value)}
                                required
                                type="date"
                                value={newScheduleDate}
                              />
                            </label>
                            <label>
                              시간
                              <input
                                onChange={(event) => onNewScheduleTimeChange(event.target.value)}
                                placeholder="예: 10:30"
                                required
                                type="text"
                                value={newScheduleTime}
                              />
                            </label>
                          </div>

                          <div className="form-grid-two">
                            <label>
                              유형
                              <select
                                onChange={(event) =>
                                  onNewScheduleTypeChange(event.target.value as ScheduleItem["type"])
                                }
                                value={newScheduleType}
                              >
                                {scheduleTypeOptions.map(([type, label]) => (
                                  <option key={type} value={type}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label>
                              연결 장소
                              <select
                                onChange={(event) => onNewSchedulePlaceIDChange(event.target.value)}
                                value={newSchedulePlaceID}
                              >
                                <option value="">장소 연결 안 함</option>
                                {ownerPlaces.map((place) => (
                                  <option key={place.id} value={place.id}>
                                    {place.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>

                          <label>
                            일정 제목
                            <input
                              onChange={(event) => onNewScheduleTitleChange(event.target.value)}
                              placeholder="예: 공항 도착 후 렌터카 수령"
                              required
                              type="text"
                              value={newScheduleTitle}
                            />
                          </label>

                          <label>
                            이동 메모
                            <textarea
                              onChange={(event) => onNewScheduleTransportMemoChange(event.target.value)}
                              placeholder="예: 택시, 버스, 도보 이동 정보"
                              rows={2}
                              value={newScheduleTransportMemo}
                            />
                          </label>

                          <label>
                            안내 메모
                            <textarea
                              onChange={(event) => onNewScheduleGuideMemoChange(event.target.value)}
                              placeholder="예: 준비물, 현장 주의사항, 가족에게 보여줄 설명"
                              rows={2}
                              value={newScheduleGuideMemo}
                            />
                          </label>

                          {scheduleCreateError && <p className="form-error">{scheduleCreateError}</p>}

                          <button className="primary-button" disabled={scheduleCreateSubmitting} type="submit">
                            <PlusCircle size={18} />
                            {scheduleCreateSubmitting ? "일정 추가 중" : "일정 추가"}
                          </button>
                        </form>
                      </section>

                      <section className="owner-linked-data-section">
                        <div className="section-title-row compact-title-row">
                          <div>
                            <h3>공유되는 일정</h3>
                            <p className="section-caption">현재 서버에 저장되어 공유 화면에 표시되는 일정입니다.</p>
                          </div>
                          <div className="section-actions">
                            <span className="pill subtle">{ownerSchedules.length}개</span>
                            <button
                              className="secondary-button compact-button"
                              disabled={ownerSchedules.length === 0}
                              onClick={() => onScheduleListEditingChange(!isScheduleListEditing)}
                              type="button"
                            >
                              {isScheduleListEditing ? "완료" : "편집"}
                            </button>
                          </div>
                        </div>

                        {ownerDetailDataLoading && <p className="muted">일정과 장소를 불러오는 중입니다.</p>}
                        {ownerDetailDataError && <p className="form-error">{ownerDetailDataError}</p>}
                        {scheduleDeleteError && <p className="form-error">{scheduleDeleteError}</p>}

                        {!ownerDetailDataLoading && !ownerDetailDataError && ownerSchedules.length === 0 && (
                          <article className="empty-state-card list-card">
                            <p className="muted">아직 서버에 저장된 일정이 없습니다.</p>
                          </article>
                        )}

                        {!ownerDetailDataLoading && !ownerDetailDataError && ownerSchedules.length > 0 && (
                          <div className="card-stack compact-card-stack">
                            {ownerSchedules.map((schedule) => {
                              const place = ownerPlaceByID.get(schedule.placeId ?? "");
                              return (
                                <article className="owner-linked-card" key={schedule.id}>
                                  <div>
                                    <span className="muted-label">
                                      {formatKoreanDate(schedule.date)} · {schedule.time || "시간 미정"}
                                    </span>
                                    <h2>{schedule.title}</h2>
                                    <p className="section-caption">
                                      {getScheduleTypeLabel(schedule.type)}
                                      {place ? ` · ${place.name}` : ""}
                                    </p>
                                  </div>
                                  {schedule.guideMemo && <p className="muted">{schedule.guideMemo}</p>}
                                  {isScheduleListEditing && (
                                    <div className="owner-linked-actions">
                                      <button
                                        className="danger-button compact-button"
                                        disabled={deletingScheduleID === schedule.id}
                                        onClick={() => onDeleteSchedule(schedule.id)}
                                        type="button"
                                      >
                                        <Trash2 size={16} />
                                        {deletingScheduleID === schedule.id ? "삭제 중" : "삭제"}
                                      </button>
                                    </div>
                                  )}
                                </article>
                              );
                            })}
                          </div>
                        )}
                      </section>

                      <section className="owner-linked-data-section">
                        <div className="section-title-row compact-title-row">
                          <div>
                            <h3>공유되는 장소</h3>
                            <p className="section-caption">일정에서 참조하거나 공유 화면에 표시되는 장소입니다.</p>
                          </div>
                          <div className="section-actions">
                            <span className="pill subtle">{ownerPlaces.length}개</span>
                            <button
                              className="secondary-button compact-button"
                              disabled={ownerPlaces.length === 0}
                              onClick={() => onPlaceListEditingChange(!isPlaceListEditing)}
                              type="button"
                            >
                              {isPlaceListEditing ? "완료" : "편집"}
                            </button>
                          </div>
                        </div>

                        {placeDeleteError && <p className="form-error">{placeDeleteError}</p>}

                        {!ownerDetailDataLoading && !ownerDetailDataError && ownerPlaces.length === 0 && (
                          <article className="empty-state-card list-card">
                            <p className="muted">아직 서버에 저장된 장소가 없습니다.</p>
                          </article>
                        )}

                        {!ownerDetailDataLoading && !ownerDetailDataError && ownerPlaces.length > 0 && (
                          <div className="card-stack compact-card-stack">
                            {ownerPlaces.map((place) => (
                              <article className="owner-linked-card" key={place.id}>
                                <div>
                                  <span className="muted-label">{place.category}</span>
                                  <h2>{place.name}</h2>
                                  {place.address && <p className="section-caption">{place.address}</p>}
                                </div>
                                <div className="owner-linked-actions">
                                  {place.googleMapsUrl && (
                                    <a
                                      className="secondary-button compact-button"
                                      href={place.googleMapsUrl}
                                      rel="noreferrer"
                                      target="_blank"
                                    >
                                      <ExternalLink size={16} />
                                      지도 열기
                                    </a>
                                  )}
                                  {isPlaceListEditing && (
                                    <button
                                      className="danger-button compact-button"
                                      disabled={deletingPlaceID === place.id}
                                      onClick={() => onDeletePlace(place.id)}
                                      type="button"
                                    >
                                      <Trash2 size={16} />
                                      {deletingPlaceID === place.id ? "삭제 중" : "삭제"}
                                    </button>
                                  )}
                                </div>
                              </article>
                            ))}
                          </div>
                        )}
                      </section>

                      <section className="owner-linked-data-section">
                        <div className="section-title-row compact-title-row">
                          <div>
                            <h3>공유되는 항공편</h3>
                            <p className="section-caption">공유 화면 항공 정보에 표시되는 항공편입니다.</p>
                          </div>
                          <span className="pill subtle">{ownerFlights.length}개</span>
                        </div>

                        {!ownerDetailDataLoading && !ownerDetailDataError && ownerFlights.length === 0 && (
                          <article className="empty-state-card list-card">
                            <p className="muted">아직 서버에 저장된 항공편이 없습니다.</p>
                          </article>
                        )}

                        {!ownerDetailDataLoading && !ownerDetailDataError && ownerFlights.length > 0 && (
                          <div className="card-stack compact-card-stack">
                            {ownerFlights.map((flight) => (
                              <article className="owner-linked-card" key={flight.id}>
                                <div>
                                  <span className="muted-label">
                                    {getFlightDirectionLabel(flight.direction)} ·{" "}
                                    {formatKoreanDate(flight.departureDate)} {flight.departureTime}
                                  </span>
                                  <h2>
                                    {flight.label}
                                    {flight.flightNumber ? ` · ${flight.flightNumber}` : ""}
                                  </h2>
                                  <p className="section-caption">
                                    {flight.departureAirport} → {flight.arrivalAirport}
                                  </p>
                                </div>
                                {flight.memo && <p className="muted">{flight.memo}</p>}
                              </article>
                            ))}
                          </div>
                        )}
                      </section>
                    </article>
                  </section>
                )}

                <section className="section-block">
                  <div className="section-title-row">
                    <div>
                      <h2>새 여행 만들기</h2>
                      <p className="section-caption">여행명과 기간만 입력하면 먼저 여행 공간을 만들 수 있습니다.</p>
                    </div>
                  </div>

                  <form className="auth-form trip-create-form" onSubmit={onSubmitNewTrip}>
                    <label>
                      여행명
                      <input
                        onChange={(event) => onNewTripTitleChange(event.target.value)}
                        placeholder="예: 여름 가족 여행"
                        required
                        type="text"
                        value={newTripTitle}
                      />
                    </label>

                    <div className="form-grid-two">
                      <label>
                        시작일
                        <input
                          onChange={(event) => onNewTripStartDateChange(event.target.value)}
                          required
                          type="date"
                          value={newTripStartDate}
                        />
                      </label>
                      <label>
                        종료일
                        <input
                          min={newTripStartDate || undefined}
                          onChange={(event) => onNewTripEndDateChange(event.target.value)}
                          required
                          type="date"
                          value={newTripEndDate}
                        />
                      </label>
                    </div>

                    <label>
                      여행자
                      <textarea
                        onChange={(event) => onNewTripTravelersChange(event.target.value)}
                        placeholder="쉼표 또는 줄바꿈으로 입력&#10;예: 나, 가족"
                        rows={3}
                        value={newTripTravelers}
                      />
                    </label>

                    <label>
                      메모
                      <textarea
                        onChange={(event) => onNewTripMemoChange(event.target.value)}
                        placeholder="여행 목적, 주의사항, 준비 메모"
                        rows={3}
                        value={newTripMemo}
                      />
                    </label>

                    {tripCreateError && <p className="form-error">{tripCreateError}</p>}

                    <button className="primary-button" disabled={tripCreateSubmitting} type="submit">
                      <PlusCircle size={18} />
                      {tripCreateSubmitting ? "만드는 중" : "새 여행 만들기"}
                    </button>
                  </form>
                </section>

                <section className="section-block">
                  <div className="section-title-row">
                    <h2>여행 목록</h2>
                    <span className="pill subtle">{ownerTrips.length}개</span>
                  </div>

                  {ownerTripsLoading && <p className="muted">여행 목록을 불러오는 중입니다.</p>}

                  {ownerTripsError && <p className="form-error">{ownerTripsError}</p>}

                  {!ownerTripsLoading && !ownerTripsError && ownerTrips.length === 0 && (
                    <article className="info-card empty-state-card">
                      <PlusCircle size={28} />
                      <h2>아직 만든 여행이 없습니다</h2>
                      <p className="muted">위 폼에서 첫 여행을 만들면 이 목록에 바로 표시됩니다.</p>
                    </article>
                  )}

                  {!ownerTripsLoading && !ownerTripsError && ownerTrips.length > 0 && (
                    <div className="card-stack">
                      {ownerTrips.map((ownerTrip) => (
                        <article className="owner-trip-card" key={ownerTrip.id}>
                          <div>
                            <span className="pill subtle">여행</span>
                            <h2>{ownerTrip.title}</h2>
                            <p className="muted">
                              {formatKoreanDate(ownerTrip.startDate)} ~ {formatKoreanDate(ownerTrip.endDate)}
                            </p>
                            <p>{ownerTrip.travelers.length > 0 ? ownerTrip.travelers.join(", ") : "여행자 미입력"}</p>
                          </div>
                          <button
                            className="secondary-button compact-button"
                            onClick={() => onSelectOwnerTrip(ownerTrip.id)}
                            type="button"
                          >
                            관리하기
                          </button>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
