package service

import (
	"errors"
	"testing"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/dto"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/model"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/repository"
)

func TestCreateTripPreservesWorldwideDestinationCountry(t *testing.T) {
	tripRepo := repository.NewMemoryTripRepository()
	service := NewTripService(tripRepo, repository.NewMemoryChecklistRepository())

	created, err := service.CreateTrip("owner-worldwide", dto.CreateTripRequest{
		Title:              "서울 여행",
		StartDate:          "2026-08-10",
		EndDate:            "2026-08-12",
		DestinationCountry: "KR",
	})
	if err != nil {
		t.Fatalf("CreateTrip() error = %v", err)
	}
	if created.DestinationCountry != "KR" {
		t.Fatalf("destinationCountry = %q, want KR", created.DestinationCountry)
	}
}

func TestCreateTripRejectsInvalidDateRangeAndCountryCode(t *testing.T) {
	tripRepo := repository.NewMemoryTripRepository()
	tripService := NewTripService(tripRepo, repository.NewMemoryChecklistRepository())

	for _, request := range []dto.CreateTripRequest{
		{Title: "역전된 날짜", StartDate: "2026-08-12", EndDate: "2026-08-10", DestinationCountry: "KR"},
		{Title: "잘못된 날짜", StartDate: "2026/08/10", EndDate: "2026-08-12", DestinationCountry: "KR"},
		{Title: "잘못된 국가", StartDate: "2026-08-10", EndDate: "2026-08-12", DestinationCountry: "KOR"},
	} {
		if _, err := tripService.CreateTrip("owner", request); !errors.Is(err, ErrInvalidTrip) {
			t.Fatalf("CreateTrip(%+v) error = %v, want ErrInvalidTrip", request, err)
		}
	}
}

func TestGetSharedTripOmitsSensitiveInternalMemos(t *testing.T) {
	tripRepo := repository.NewMemoryTripRepository()
	checklistRepo := repository.NewMemoryChecklistRepository()

	service := NewTripService(tripRepo, checklistRepo)

	const (
		tripID  = "test-mask-trip"
		ownerID = "test-mask-owner"
	)

	// 1. 테스트용 여행 생성
	_ = tripRepo.Save(model.Trip{
		ID:      tripID,
		OwnerID: ownerID,
		Title:   "민감 데이터 마스킹 테스트",
	})

	// 2. 공유 링크 생성
	shareLink, err := service.CreateShareLink(tripID, ownerID)
	if err != nil {
		t.Fatalf("CreateShareLink failed: %v", err)
	}

	// 3. 예약/가이드 메모가 포함된 스케줄 추가
	_ = tripRepo.SaveSchedule(model.Schedule{
		ID:            "sch-sensitive",
		TripID:        tripID,
		Date:          "2026-06-27",
		Time:          "14:00",
		Type:          "hotel",
		Title:         "호텔 체크인",
		GuideMemo:     "CONFIRM-998811",
		TransportMemo: "BUS-8877",
	})

	// 4. 비행편 추가
	_ = tripRepo.SaveFlight(model.Flight{
		ID:               "fl-sensitive",
		TripID:           tripID,
		Direction:        "departure",
		Label:            "출국",
		DepartureAirport: "ICN",
		ArrivalAirport:   "KOJ",
		DepartureDate:    "2026-06-27",
		DepartureTime:    "09:00",
		Memo:             "티켓번호 777-1234-5678",
	})

	// 5. 공유 API 호출
	sharedResp, err := service.GetSharedTrip(shareLink.Token)
	if err != nil {
		t.Fatalf("GetSharedTrip failed: %v", err)
	}

	// 6. 스케줄 가이드/이동 메모 비공개 검증
	var foundSchedule bool
	for _, sch := range sharedResp.Schedules {
		if sch.ID == "sch-sensitive" {
			foundSchedule = true
			if sch.GuideMemo != "" {
				t.Errorf("GuideMemo = %q, want omitted", sch.GuideMemo)
			}
			if sch.TransportMemo != "" {
				t.Errorf("TransportMemo = %q, want omitted", sch.TransportMemo)
			}
		}
	}
	if !foundSchedule {
		t.Errorf("sensitive schedule not found in shared response")
	}

	// 7. 비행편 메모 비공개 검증
	var foundFlight bool
	for _, fl := range sharedResp.Flights {
		if fl.ID == "fl-sensitive" {
			foundFlight = true
			if fl.Memo != "" {
				t.Errorf("Flight Memo = %q, want omitted", fl.Memo)
			}
		}
	}
	if !foundFlight {
		t.Errorf("sensitive flight not found in shared response")
	}
}

func TestListMyTripsIncludesChildCounts(t *testing.T) {
	tripRepo := repository.NewMemoryTripRepository()
	service := NewTripService(tripRepo, repository.NewMemoryChecklistRepository())

	const (
		tripID  = "count-trip"
		ownerID = "count-owner"
	)

	if err := tripRepo.Save(model.Trip{
		ID:        tripID,
		OwnerID:   ownerID,
		Title:     "개수 집계 테스트",
		StartDate: "2026-11-03",
		EndDate:   "2026-11-06",
	}); err != nil {
		t.Fatalf("Save() error = %v", err)
	}
	if err := tripRepo.SavePlace(model.Place{ID: "place-1", TripID: tripID, Name: "센간엔"}); err != nil {
		t.Fatalf("SavePlace() error = %v", err)
	}
	if err := tripRepo.SavePlace(model.Place{ID: "place-2", TripID: tripID, Name: "사쿠라지마"}); err != nil {
		t.Fatalf("SavePlace() error = %v", err)
	}
	if err := tripRepo.SaveSchedule(model.Schedule{ID: "schedule-1", TripID: tripID, Title: "센간엔 관람"}); err != nil {
		t.Fatalf("SaveSchedule() error = %v", err)
	}

	trips, err := service.ListMyTrips(ownerID)
	if err != nil {
		t.Fatalf("ListMyTrips() error = %v", err)
	}
	if len(trips) != 1 {
		t.Fatalf("len(trips) = %d, want 1", len(trips))
	}
	if trips[0].PlaceCount != 2 {
		t.Errorf("PlaceCount = %d, want 2", trips[0].PlaceCount)
	}
	if trips[0].ScheduleCount != 1 {
		t.Errorf("ScheduleCount = %d, want 1", trips[0].ScheduleCount)
	}
	if trips[0].FlightCount != 0 {
		t.Errorf("FlightCount = %d, want 0", trips[0].FlightCount)
	}
}
