package service

import (
	"context"
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/dto"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/model"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/repository"
)

var (
	ErrTripNotFound             = errors.New("trip not found")
	ErrShareNotFound            = errors.New("share link not found")
	ErrForbidden                = errors.New("forbidden")
	ErrInvalidTrip              = errors.New("invalid trip input")
	ErrTripDateConflict         = errors.New("trip date conflicts with dated items")
	ErrPlaceSearchUnavailable   = errors.New("place search unavailable")
	ErrPlaceSearchQuotaExceeded = errors.New("place search monthly quota exceeded")
)

const googlePlacesMonthlyLimit = 4500

type TripService struct {
	tripRepository      repository.TripRepository
	checklistRepository repository.ChecklistRepository
	ctx                 context.Context
}

func (s *TripService) WithContext(ctx context.Context) *TripService {
	return &TripService{
		tripRepository:      repository.WithTripRepositoryContext(s.tripRepository, ctx),
		checklistRepository: s.checklistRepository,
		ctx:                 ctx,
	}
}

func (s *TripService) context() context.Context {
	if s.ctx != nil {
		return s.ctx
	}
	return context.Background()
}

func NewTripService(tripRepository repository.TripRepository, checklistRepository repository.ChecklistRepository) *TripService {
	return &TripService{
		tripRepository:      tripRepository,
		checklistRepository: checklistRepository,
	}
}

func (s *TripService) GetTrip(id string) (dto.TripResponse, error) {
	trip, err := s.tripRepository.FindTrip(id)
	if err != nil {
		return dto.TripResponse{}, mapRepositoryError(err)
	}
	return mapTripResponse(trip), nil
}

func (s *TripService) GetOwnedTrip(id, ownerID string) (dto.TripResponse, error) {
	trip, err := s.tripRepository.FindTrip(id)
	if err != nil {
		return dto.TripResponse{}, mapRepositoryError(err)
	}
	if !sameID(trip.OwnerID, ownerID) {
		return dto.TripResponse{}, ErrForbidden
	}
	return mapTripResponse(trip), nil
}

func (s *TripService) CreateShareLink(tripID, ownerID string) (dto.ShareLinkResponse, error) {
	trip, err := s.tripRepository.FindTrip(tripID)
	if err != nil {
		return dto.ShareLinkResponse{}, mapRepositoryError(err)
	}
	if !sameID(trip.OwnerID, ownerID) {
		return dto.ShareLinkResponse{}, ErrForbidden
	}

	id, err := newID()
	if err != nil {
		return dto.ShareLinkResponse{}, err
	}
	token, err := newShareToken()
	if err != nil {
		return dto.ShareLinkResponse{}, err
	}

	link := model.ShareLink{
		ID:        id,
		TripID:    tripID,
		Token:     token,
		CreatedAt: time.Now(),
	}

	if err := s.tripRepository.SaveShareLink(link); err != nil {
		return dto.ShareLinkResponse{}, err
	}
	return mapShareLinkResponse(link), nil
}

func (s *TripService) GetSharedTrip(token string) (dto.SharedTripResponse, error) {
	link, err := s.tripRepository.FindShareLinkByToken(token)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return dto.SharedTripResponse{}, ErrShareNotFound
		}
		return dto.SharedTripResponse{}, err
	}

	trip, err := s.tripRepository.FindTrip(link.TripID)
	if err != nil {
		return dto.SharedTripResponse{}, mapRepositoryError(err)
	}
	schedules, err := s.ListSchedules(link.TripID)
	if err != nil {
		return dto.SharedTripResponse{}, err
	}
	places, err := s.ListPlaces(link.TripID)
	if err != nil {
		return dto.SharedTripResponse{}, err
	}
	flights, err := s.ListFlights(link.TripID)
	if err != nil {
		return dto.SharedTripResponse{}, err
	}

	// 공유 링크는 로그인 없이 열리므로 내부 메모를 일부라도 노출하지 않습니다.
	sharedFlights := make([]dto.FlightResponse, len(flights))
	copy(sharedFlights, flights)
	for i := range sharedFlights {
		sharedFlights[i].Memo = ""
	}

	sharedSchedules := make([]dto.ScheduleResponse, len(schedules))
	copy(sharedSchedules, schedules)
	for i := range sharedSchedules {
		sharedSchedules[i].GuideMemo = ""
		sharedSchedules[i].TransportMemo = ""
	}

	routes, err := s.ListRoutes(link.TripID)
	if err != nil {
		return dto.SharedTripResponse{}, err
	}

	checklistItems, err := s.checklistRepository.FindByTrip(s.context(), link.TripID)
	if err != nil {
		return dto.SharedTripResponse{}, err
	}
	sharedChecklist := make([]dto.ChecklistItemResponse, 0, len(checklistItems))
	for _, item := range checklistItems {
		sharedChecklist = append(sharedChecklist, mapChecklistItemResponse(item))
	}

	return dto.SharedTripResponse{
		Trip:      mapPublicTripResponse(trip),
		Schedules: sharedSchedules,
		Places:    places,
		Flights:   sharedFlights,
		Routes:    routes,
		Checklist: sharedChecklist,
	}, nil
}

func (s *TripService) ListSchedules(tripID string) ([]dto.ScheduleResponse, error) {
	schedules, err := s.tripRepository.FindSchedules(tripID)
	if err != nil {
		return nil, mapRepositoryError(err)
	}

	responses := make([]dto.ScheduleResponse, 0, len(schedules))
	for _, schedule := range schedules {
		responses = append(responses, mapScheduleResponse(schedule))
	}
	return responses, nil
}

func (s *TripService) ListSchedulesForOwner(tripID, ownerID string) ([]dto.ScheduleResponse, error) {
	if err := s.ensureTripOwner(tripID, ownerID); err != nil {
		return nil, err
	}
	return s.ListSchedules(tripID)
}

func (s *TripService) CreateSchedule(tripID, ownerID string, req dto.CreateScheduleRequest) (dto.ScheduleResponse, error) {
	trip, err := s.findOwnedTrip(tripID, ownerID)
	if err != nil {
		return dto.ScheduleResponse{}, err
	}
	title, validTitle := normalizeRequiredText(req.Title, maxTitleRunes)
	if !validTitle || strings.TrimSpace(req.Time) == "" || strings.TrimSpace(req.Type) == "" || !isDateWithinTrip(req.Date, trip) {
		return dto.ScheduleResponse{}, ErrInvalidTrip
	}
	if req.PlaceID != "" {
		if _, err := s.tripRepository.FindPlace(tripID, req.PlaceID); err != nil {
			return dto.ScheduleResponse{}, mapRepositoryError(err)
		}
	}
	id, err := newID()
	if err != nil {
		return dto.ScheduleResponse{}, err
	}
	schedule := model.Schedule{
		ID:            id,
		TripID:        tripID,
		PlaceID:       req.PlaceID,
		Date:          req.Date,
		Time:          req.Time,
		Type:          req.Type,
		Title:         title,
		TransportMemo: req.TransportMemo,
		GuideMemo:     req.GuideMemo,
	}
	if err := s.tripRepository.SaveSchedule(schedule); err != nil {
		return dto.ScheduleResponse{}, err
	}
	return mapScheduleResponse(schedule), nil
}

// UpdateSchedule은 여행 소유자만 기존 일정을 부분 수정할 수 있게 한다.
func (s *TripService) UpdateSchedule(tripID, scheduleID, ownerID string, req dto.UpdateScheduleRequest) (dto.ScheduleResponse, error) {
	trip, err := s.findOwnedTrip(tripID, ownerID)
	if err != nil {
		return dto.ScheduleResponse{}, err
	}
	schedule, err := s.tripRepository.FindSchedule(tripID, scheduleID)
	if err != nil {
		return dto.ScheduleResponse{}, mapRepositoryError(err)
	}

	// PATCH 요청은 전달된 필드만 바꾸고, 누락된 필드는 기존 일정 값을 유지한다.
	if req.PlaceID != nil {
		schedule.PlaceID = *req.PlaceID
	}
	if req.Date != nil {
		schedule.Date = *req.Date
	}
	if req.Time != nil {
		schedule.Time = *req.Time
	}
	if req.Type != nil {
		schedule.Type = *req.Type
	}
	if req.Title != nil {
		schedule.Title = *req.Title
	}
	if req.TransportMemo != nil {
		schedule.TransportMemo = *req.TransportMemo
	}
	if req.GuideMemo != nil {
		schedule.GuideMemo = *req.GuideMemo
	}

	// 수정 후에도 일정 화면의 핵심 필드는 비어 있으면 안 된다.
	title, validTitle := normalizeRequiredText(schedule.Title, maxTitleRunes)
	if !validTitle || strings.TrimSpace(schedule.Time) == "" || strings.TrimSpace(schedule.Type) == "" || !isDateWithinTrip(schedule.Date, trip) {
		return dto.ScheduleResponse{}, ErrInvalidTrip
	}
	schedule.Title = title
	if schedule.PlaceID != "" {
		if _, err := s.tripRepository.FindPlace(tripID, schedule.PlaceID); err != nil {
			return dto.ScheduleResponse{}, mapRepositoryError(err)
		}
	}
	if err := s.tripRepository.UpdateSchedule(schedule); err != nil {
		return dto.ScheduleResponse{}, mapRepositoryError(err)
	}
	return mapScheduleResponse(schedule), nil
}

func (s *TripService) DeleteSchedule(tripID, scheduleID, ownerID string) error {
	if err := s.ensureTripOwner(tripID, ownerID); err != nil {
		return err
	}
	if err := s.tripRepository.DeleteSchedule(tripID, scheduleID); err != nil {
		return mapRepositoryError(err)
	}
	return nil
}

func (s *TripService) CreatePlace(tripID, ownerID string, req dto.CreatePlaceRequest) (dto.PlaceResponse, error) {
	if err := s.ensureTripOwner(tripID, ownerID); err != nil {
		return dto.PlaceResponse{}, err
	}
	name, validName := normalizeRequiredText(req.Name, 160)
	if !validName || strings.TrimSpace(req.Category) == "" || !validCoordinates(req.Latitude, req.Longitude) {
		return dto.PlaceResponse{}, ErrInvalidTrip
	}
	id, err := newID()
	if err != nil {
		return dto.PlaceResponse{}, err
	}
	place := model.Place{
		ID:                id,
		TripID:            tripID,
		Name:              name,
		Category:          req.Category,
		Address:           req.Address,
		GoogleMapsURL:     req.GoogleMapsURL,
		RecommendedReason: req.RecommendedReason,
		Latitude:          req.Latitude,
		Longitude:         req.Longitude,
		GooglePlaceID:     req.GooglePlaceID,
		ChineseName:       req.ChineseName,
		ChineseAddress:    req.ChineseAddress,
		SubwayExit:        req.SubwayExit,
		TaxiPhrase:        req.TaxiPhrase,
	}
	if err := s.tripRepository.SavePlace(place); err != nil {
		return dto.PlaceResponse{}, err
	}
	return mapPlaceResponse(place), nil
}

// UpdatePlace는 여행 소유자가 장소 정보를 부분 수정할 때 기존 값을 보존한다.
func (s *TripService) UpdatePlace(tripID, placeID, ownerID string, req dto.UpdatePlaceRequest) (dto.PlaceResponse, error) {
	if err := s.ensureTripOwner(tripID, ownerID); err != nil {
		return dto.PlaceResponse{}, err
	}
	place, err := s.tripRepository.FindPlace(tripID, placeID)
	if err != nil {
		return dto.PlaceResponse{}, mapRepositoryError(err)
	}

	// PATCH 요청은 사용자가 편집한 입력만 덮어쓰고, 누락된 값은 현재 장소 정보를 유지한다.
	if req.Name != nil {
		place.Name = *req.Name
	}
	if req.Category != nil {
		place.Category = *req.Category
	}
	if req.Address != nil {
		place.Address = *req.Address
	}
	if req.GoogleMapsURL != nil {
		place.GoogleMapsURL = *req.GoogleMapsURL
	}
	if req.RecommendedReason != nil {
		place.RecommendedReason = *req.RecommendedReason
	}
	if req.Latitude != nil {
		place.Latitude = req.Latitude
	}
	if req.Longitude != nil {
		place.Longitude = req.Longitude
	}
	if req.GooglePlaceID != nil {
		place.GooglePlaceID = *req.GooglePlaceID
	}
	if req.ChineseName != nil {
		place.ChineseName = *req.ChineseName
	}
	if req.ChineseAddress != nil {
		place.ChineseAddress = *req.ChineseAddress
	}
	if req.SubwayExit != nil {
		place.SubwayExit = *req.SubwayExit
	}
	if req.TaxiPhrase != nil {
		place.TaxiPhrase = *req.TaxiPhrase
	}

	// 장소 카드가 화면에 의미 있게 표시되려면 이름과 분류는 수정 후에도 필수다.
	name, validName := normalizeRequiredText(place.Name, 160)
	if !validName || strings.TrimSpace(place.Category) == "" || !validCoordinates(place.Latitude, place.Longitude) {
		return dto.PlaceResponse{}, ErrInvalidTrip
	}
	place.Name = name
	if err := s.tripRepository.UpdatePlace(place); err != nil {
		return dto.PlaceResponse{}, mapRepositoryError(err)
	}
	return mapPlaceResponse(place), nil
}

func (s *TripService) ListPlaces(tripID string) ([]dto.PlaceResponse, error) {
	places, err := s.tripRepository.FindPlaces(tripID)
	if err != nil {
		return nil, mapRepositoryError(err)
	}

	responses := make([]dto.PlaceResponse, 0, len(places))
	for _, place := range places {
		responses = append(responses, mapPlaceResponse(place))
	}
	return responses, nil
}

func (s *TripService) ListPlacesForOwner(tripID, ownerID string) ([]dto.PlaceResponse, error) {
	if err := s.ensureTripOwner(tripID, ownerID); err != nil {
		return nil, err
	}
	return s.ListPlaces(tripID)
}

func (s *TripService) DeletePlace(tripID, placeID, ownerID string) error {
	if err := s.ensureTripOwner(tripID, ownerID); err != nil {
		return err
	}
	if err := s.tripRepository.DeletePlace(tripID, placeID); err != nil {
		return mapRepositoryError(err)
	}
	return nil
}

func (s *TripService) CreateFlight(tripID, ownerID string, req dto.CreateFlightRequest) (dto.FlightResponse, error) {
	if err := s.ensureTripOwner(tripID, ownerID); err != nil {
		return dto.FlightResponse{}, err
	}
	if strings.TrimSpace(req.Direction) == "" || strings.TrimSpace(req.Label) == "" ||
		strings.TrimSpace(req.DepartureAirport) == "" || strings.TrimSpace(req.ArrivalAirport) == "" ||
		strings.TrimSpace(req.DepartureTime) == "" || !validateFlightDates(req.DepartureDate, req.ArrivalDate) {
		return dto.FlightResponse{}, ErrInvalidTrip
	}
	id, err := newID()
	if err != nil {
		return dto.FlightResponse{}, err
	}
	flight := model.Flight{
		ID:               id,
		TripID:           tripID,
		Direction:        req.Direction,
		Label:            req.Label,
		Airline:          req.Airline,
		FlightNumber:     req.FlightNumber,
		DepartureAirport: req.DepartureAirport,
		ArrivalAirport:   req.ArrivalAirport,
		DepartureDate:    req.DepartureDate,
		DepartureTime:    req.DepartureTime,
		ArrivalDate:      req.ArrivalDate,
		ArrivalTime:      req.ArrivalTime,
		Memo:             req.Memo,
	}
	if err := s.tripRepository.SaveFlight(flight); err != nil {
		return dto.FlightResponse{}, err
	}
	return mapFlightResponse(flight), nil
}

func (s *TripService) ListFlights(tripID string) ([]dto.FlightResponse, error) {
	flights, err := s.tripRepository.FindFlights(tripID)
	if err != nil {
		return nil, mapRepositoryError(err)
	}

	responses := make([]dto.FlightResponse, 0, len(flights))
	for _, flight := range flights {
		responses = append(responses, mapFlightResponse(flight))
	}
	return responses, nil
}

func (s *TripService) ListFlightsForOwner(tripID, ownerID string) ([]dto.FlightResponse, error) {
	if err := s.ensureTripOwner(tripID, ownerID); err != nil {
		return nil, err
	}
	return s.ListFlights(tripID)
}

// UpdateFlight는 여행 소유자가 항공편 정보를 부분 수정할 때 기존 값을 보존한다.
func (s *TripService) UpdateFlight(tripID, flightID, ownerID string, req dto.UpdateFlightRequest) (dto.FlightResponse, error) {
	if err := s.ensureTripOwner(tripID, ownerID); err != nil {
		return dto.FlightResponse{}, err
	}
	flight, err := s.tripRepository.FindFlight(tripID, flightID)
	if err != nil {
		return dto.FlightResponse{}, mapRepositoryError(err)
	}

	// PATCH 요청은 사용자가 편집한 항공편 필드만 덮어쓰고 나머지는 기존 값을 유지한다.
	if req.Direction != nil {
		flight.Direction = *req.Direction
	}
	if req.Label != nil {
		flight.Label = *req.Label
	}
	if req.Airline != nil {
		flight.Airline = *req.Airline
	}
	if req.FlightNumber != nil {
		flight.FlightNumber = *req.FlightNumber
	}
	if req.DepartureAirport != nil {
		flight.DepartureAirport = *req.DepartureAirport
	}
	if req.ArrivalAirport != nil {
		flight.ArrivalAirport = *req.ArrivalAirport
	}
	if req.DepartureDate != nil {
		flight.DepartureDate = *req.DepartureDate
	}
	if req.DepartureTime != nil {
		flight.DepartureTime = *req.DepartureTime
	}
	if req.ArrivalDate != nil {
		flight.ArrivalDate = *req.ArrivalDate
	}
	if req.ArrivalTime != nil {
		flight.ArrivalTime = *req.ArrivalTime
	}
	if req.Memo != nil {
		flight.Memo = *req.Memo
	}

	// 공유 화면에서 항공편 카드가 성립하려면 핵심 이동 정보는 수정 후에도 비어 있으면 안 된다.
	if strings.TrimSpace(flight.Direction) == "" || strings.TrimSpace(flight.Label) == "" ||
		strings.TrimSpace(flight.DepartureAirport) == "" || strings.TrimSpace(flight.ArrivalAirport) == "" ||
		strings.TrimSpace(flight.DepartureTime) == "" || !validateFlightDates(flight.DepartureDate, flight.ArrivalDate) {
		return dto.FlightResponse{}, ErrInvalidTrip
	}
	if err := s.tripRepository.UpdateFlight(flight); err != nil {
		return dto.FlightResponse{}, mapRepositoryError(err)
	}
	return mapFlightResponse(flight), nil
}

func (s *TripService) DeleteFlight(tripID, flightID, ownerID string) error {
	if err := s.ensureTripOwner(tripID, ownerID); err != nil {
		return err
	}
	// 항공편 삭제도 여행 소유권을 먼저 확인한 뒤 여행 ID와 항공편 ID를 함께 사용해 경계를 고정한다.
	if err := s.tripRepository.DeleteFlight(tripID, flightID); err != nil {
		return mapRepositoryError(err)
	}
	return nil
}

func (s *TripService) ListRoutes(tripID string) ([]dto.RouteResponse, error) {
	routes, err := s.tripRepository.FindRoutes(tripID)
	if err != nil {
		return nil, mapRepositoryError(err)
	}

	responses := make([]dto.RouteResponse, 0, len(routes))
	for _, route := range routes {
		responses = append(responses, mapRouteResponse(route))
	}
	return responses, nil
}

func (s *TripService) ListRoutesForOwner(tripID, ownerID string) ([]dto.RouteResponse, error) {
	if err := s.ensureTripOwner(tripID, ownerID); err != nil {
		return nil, err
	}
	return s.ListRoutes(tripID)
}

type PresetItem struct {
	Category           string
	Title              string
	DestinationCountry string
}

var defaultChecklistPresets = []PresetItem{
	{Category: "before", Title: "여권"},
	{Category: "before", Title: "로밍 또는 eSIM 확인"},
	{Category: "before", Title: "보조배터리"},
	{Category: "before", Title: "골프화와 장갑"},
	{Category: "before", Title: "우비 또는 바람막이"},
	{Category: "airport", Title: "항공권과 여권 확인"},
	{Category: "daily", Title: "티오프 시간 확인"},
	{Category: "daily", Title: "상비약 챙기기"},
	{Category: "return", Title: "입국 전 짐과 선물 확인"},

	// 일본 전용 필수 항목
	{Category: "before", Title: "Visit Japan Web 동반가족 포함 사전 등록", DestinationCountry: "JP"},
	{Category: "before", Title: "현금 및 100엔 동전지갑 준비", DestinationCountry: "JP"},
	{Category: "before", Title: "110V 11자 돼지코 콘센트 플러그", DestinationCountry: "JP"},

	// 중국 전용 필수 항목 (상하이 실전 8종 패키지)
	{Category: "before", Title: "알리페이(Alipay)/위챗페이 결제카드 사전 등록 및 신원확인(여권) 완료", DestinationCountry: "CN"},
	{Category: "before", Title: "비상용 현금(위안화) 및 해외 결제 가능 신용카드 예비 준비", DestinationCountry: "CN"},
	{Category: "before", Title: "고덕지도(Amap) 및 디디추싱(Didi) 택시 호출 앱 사전 설정", DestinationCountry: "CN"},
	{Category: "before", Title: "중국 모바일 데이터 로밍 또는 eSIM/유심 작동 상태 점검", DestinationCountry: "CN"},
	{Category: "before", Title: "VPN 우회 프로그램(인스타/구글 접속용) 사전에 2개 이상 설치", DestinationCountry: "CN"},
	{Category: "before", Title: "여권 사본 및 중국 무비자/비자 증빙 서류 지참", DestinationCountry: "CN"},
	{Category: "airport", Title: "공항 도착 후 호텔 이동 수단(지하철/자기부상열차/택시) 탑승 위치 파악", DestinationCountry: "CN"},
	{Category: "daily", Title: "실물 여권 항상 소지 및 호텔 명함(중국어 주소/전화번호) 지참", DestinationCountry: "CN"},
}

func (s *TripService) CreateTrip(ownerID string, req dto.CreateTripRequest) (dto.TripResponse, error) {
	title, validTitle := normalizeRequiredText(req.Title, maxTitleRunes)
	destCountry, validCountry := normalizeCountryCode(req.DestinationCountry)
	if !validTitle || !validCountry || !validateDateRange(req.StartDate, req.EndDate) {
		return dto.TripResponse{}, ErrInvalidTrip
	}
	id, err := newID()
	if err != nil {
		return dto.TripResponse{}, err
	}
	trip := model.Trip{
		ID:                 id,
		OwnerID:            ownerID,
		Title:              title,
		StartDate:          req.StartDate,
		EndDate:            req.EndDate,
		Travelers:          req.Travelers,
		DestinationCountry: destCountry,
		Memo:               req.Memo,
	}
	// 기본 체크리스트 프리셋 자동 주입
	presetItems := make([]model.ChecklistItem, 0)
	for _, preset := range defaultChecklistPresets {
		if preset.DestinationCountry == "" || preset.DestinationCountry == destCountry {
			itemID, err := newID()
			if err != nil {
				return dto.TripResponse{}, err
			}
			presetItems = append(presetItems, model.ChecklistItem{
				ID:                 itemID,
				TripID:             id,
				Category:           preset.Category,
				Title:              preset.Title,
				IsCompleted:        false,
				Custom:             false,
				DestinationCountry: preset.DestinationCountry,
				CreatedAt:          time.Now().Add(time.Duration(len(presetItems)) * time.Millisecond),
			})
		}
	}
	if transactional, ok := s.tripRepository.(repository.TripWithChecklistRepository); ok {
		if err := transactional.SaveTripWithChecklist(s.context(), trip, presetItems); err != nil {
			return dto.TripResponse{}, err
		}
	} else {
		if err := s.tripRepository.Save(trip); err != nil {
			return dto.TripResponse{}, err
		}
		if err := s.checklistRepository.SaveAll(s.context(), presetItems); err != nil {
			_ = s.tripRepository.Delete(trip.ID)
			return dto.TripResponse{}, err
		}
	}

	return mapTripResponse(trip), nil
}

// ListMyTrips는 목록 카드에 필요한 하위 개수까지 함께 돌려준다.
func (s *TripService) ListMyTrips(ownerID string) ([]dto.TripSummaryResponse, error) {
	summaries, err := s.tripRepository.FindSummariesByOwner(ownerID)
	if err != nil {
		return nil, err
	}

	responses := make([]dto.TripSummaryResponse, 0, len(summaries))
	for _, summary := range summaries {
		base := mapTripResponse(summary.Trip)
		responses = append(responses, dto.TripSummaryResponse{
			ID:                 base.ID,
			Title:              base.Title,
			StartDate:          base.StartDate,
			EndDate:            base.EndDate,
			Travelers:          base.Travelers,
			DestinationCountry: base.DestinationCountry,
			Memo:               base.Memo,
			PlaceCount:         summary.PlaceCount,
			ScheduleCount:      summary.ScheduleCount,
			FlightCount:        summary.FlightCount,
		})
	}
	return responses, nil
}

func (s *TripService) UpdateTrip(id, ownerID string, req dto.UpdateTripRequest) (dto.TripResponse, error) {
	trip, err := s.tripRepository.FindTrip(id)
	if err != nil {
		return dto.TripResponse{}, mapRepositoryError(err)
	}
	if !sameID(trip.OwnerID, ownerID) {
		return dto.TripResponse{}, ErrForbidden
	}
	if req.Title != nil {
		trip.Title = strings.TrimSpace(*req.Title)
	}
	if req.StartDate != nil {
		trip.StartDate = *req.StartDate
	}
	if req.EndDate != nil {
		trip.EndDate = *req.EndDate
	}
	if req.Travelers != nil {
		trip.Travelers = req.Travelers
	}
	if req.DestinationCountry != nil {
		dc, valid := normalizeCountryCode(*req.DestinationCountry)
		if !valid {
			return dto.TripResponse{}, ErrInvalidTrip
		}
		trip.DestinationCountry = dc
	}
	if req.Memo != nil {
		trip.Memo = *req.Memo
	}
	if _, valid := normalizeRequiredText(trip.Title, maxTitleRunes); !valid || !validateDateRange(trip.StartDate, trip.EndDate) {
		return dto.TripResponse{}, ErrInvalidTrip
	}
	schedules, err := s.tripRepository.FindSchedules(id)
	if err != nil {
		return dto.TripResponse{}, mapRepositoryError(err)
	}
	for _, schedule := range schedules {
		if !isDateWithinTrip(schedule.Date, trip) {
			return dto.TripResponse{}, ErrTripDateConflict
		}
	}
	checklistItems, err := s.checklistRepository.FindByTrip(s.context(), id)
	if err != nil {
		return dto.TripResponse{}, err
	}
	for _, item := range checklistItems {
		if item.ScheduledDate != "" && !isDateWithinTrip(item.ScheduledDate, trip) {
			return dto.TripResponse{}, ErrTripDateConflict
		}
	}
	if err := s.tripRepository.Update(trip); err != nil {
		return dto.TripResponse{}, mapRepositoryError(err)
	}
	return mapTripResponse(trip), nil
}

func (s *TripService) DeleteTrip(id, ownerID string) error {
	trip, err := s.tripRepository.FindTrip(id)
	if err != nil {
		return mapRepositoryError(err)
	}
	if !sameID(trip.OwnerID, ownerID) {
		return ErrForbidden
	}
	return s.tripRepository.Delete(id)
}

func (s *TripService) ensureTripOwner(tripID, ownerID string) error {
	_, err := s.findOwnedTrip(tripID, ownerID)
	return err
}

func (s *TripService) findOwnedTrip(tripID, ownerID string) (model.Trip, error) {
	trip, err := s.tripRepository.FindTrip(tripID)
	if err != nil {
		return model.Trip{}, mapRepositoryError(err)
	}
	if !sameID(trip.OwnerID, ownerID) {
		return model.Trip{}, ErrForbidden
	}
	return trip, nil
}

func mapRepositoryError(err error) error {
	if errors.Is(err, repository.ErrTripDateConflict) {
		return ErrTripDateConflict
	}
	if errors.Is(err, repository.ErrNotFound) {
		return ErrTripNotFound
	}
	return err
}

func mapTripResponse(trip model.Trip) dto.TripResponse {
	return dto.TripResponse{
		ID:                 trip.ID,
		Title:              trip.Title,
		StartDate:          trip.StartDate,
		EndDate:            trip.EndDate,
		Travelers:          trip.Travelers,
		DestinationCountry: trip.DestinationCountry,
		Memo:               trip.Memo,
	}
}

func mapPublicTripResponse(trip model.Trip) dto.PublicTripResponse {
	return dto.PublicTripResponse{
		ID:                 trip.ID,
		Title:              trip.Title,
		StartDate:          trip.StartDate,
		EndDate:            trip.EndDate,
		Travelers:          trip.Travelers,
		DestinationCountry: trip.DestinationCountry,
	}
}

func mapShareLinkResponse(link model.ShareLink) dto.ShareLinkResponse {
	res := dto.ShareLinkResponse{
		Token:   link.Token,
		APIPath: "/api/share/" + link.Token,
		WebPath: "/share/" + link.Token,
	}
	if link.ExpiresAt != nil {
		res.ExpiresAt = link.ExpiresAt.Format(time.RFC3339)
	}
	return res
}

func mapScheduleResponse(schedule model.Schedule) dto.ScheduleResponse {
	return dto.ScheduleResponse{
		ID:            schedule.ID,
		PlaceID:       schedule.PlaceID,
		Date:          schedule.Date,
		Time:          schedule.Time,
		Type:          schedule.Type,
		Title:         schedule.Title,
		TransportMemo: schedule.TransportMemo,
		GuideMemo:     schedule.GuideMemo,
	}
}

func mapPlaceResponse(place model.Place) dto.PlaceResponse {
	return dto.PlaceResponse{
		ID:                place.ID,
		Name:              place.Name,
		Category:          place.Category,
		Address:           place.Address,
		GoogleMapsURL:     place.GoogleMapsURL,
		RecommendedReason: place.RecommendedReason,
		Latitude:          place.Latitude,
		Longitude:         place.Longitude,
		GooglePlaceID:     place.GooglePlaceID,
		ChineseName:       place.ChineseName,
		ChineseAddress:    place.ChineseAddress,
		SubwayExit:        place.SubwayExit,
		TaxiPhrase:        place.TaxiPhrase,
	}
}

func mapFlightResponse(flight model.Flight) dto.FlightResponse {
	return dto.FlightResponse{
		ID:               flight.ID,
		Direction:        flight.Direction,
		Label:            flight.Label,
		Airline:          flight.Airline,
		FlightNumber:     flight.FlightNumber,
		DepartureAirport: flight.DepartureAirport,
		ArrivalAirport:   flight.ArrivalAirport,
		DepartureDate:    flight.DepartureDate,
		DepartureTime:    flight.DepartureTime,
		ArrivalDate:      flight.ArrivalDate,
		ArrivalTime:      flight.ArrivalTime,
		Memo:             flight.Memo,
	}
}

func mapRouteResponse(route model.Route) dto.RouteResponse {
	return dto.RouteResponse{
		ID:                route.ID,
		Title:             route.Title,
		Description:       route.Description,
		PlaceIDs:          route.PlaceIDs,
		TransportMemo:     route.TransportMemo,
		EstimatedDuration: route.EstimatedDuration,
	}
}

// SearchPlaces는 사용자가 입력한 검색어를 Google Places에서 찾고 공급자 장애와 월 한도를 명확한 오류로 반환합니다.
func (s *TripService) SearchPlaces(tripID, ownerID, query string) ([]dto.PlaceSearchResult, error) {
	if err := s.ensureTripOwner(tripID, ownerID); err != nil {
		return nil, err
	}
	query = strings.TrimSpace(query)
	if query == "" {
		return []dto.PlaceSearchResult{}, nil
	}
	trip, err := s.tripRepository.FindTrip(tripID)
	if err != nil {
		return nil, mapRepositoryError(err)
	}

	results, err := s.searchPlacesByCountry(trip.DestinationCountry, query)
	if err != nil {
		if errors.Is(err, ErrPlaceSearchQuotaExceeded) {
			return nil, err
		}
		return nil, fmt.Errorf("%w: %v", ErrPlaceSearchUnavailable, err)
	}
	return results, nil
}

func (s *TripService) searchPlacesByCountry(country, query string) ([]dto.PlaceSearchResult, error) {
	return s.searchPlacesGoogle(query, country)
}

func (s *TripService) searchPlacesGoogle(query, country string) ([]dto.PlaceSearchResult, error) {
	if strings.TrimSpace(os.Getenv("GOOGLE_MAPS_API_KEY")) == "" {
		return searchGooglePlaces(s.context(), query, country)
	}
	periodStart := time.Now().UTC().Format("2006-01") + "-01"
	allowed, err := s.tripRepository.ConsumeMonthlyAPIRequest("google-places-text-search", periodStart, googlePlacesMonthlyLimit)
	if err != nil {
		return nil, err
	}
	if !allowed {
		return nil, ErrPlaceSearchQuotaExceeded
	}
	return searchGooglePlaces(s.context(), query, country)
}
