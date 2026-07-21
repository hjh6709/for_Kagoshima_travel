package service

import (
	"testing"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/model"
	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/repository"
)

func TestGetSharedTripSensitiveDataMasking(t *testing.T) {
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

	// 6. 스케줄 가이드/이동 메모 마스킹 검증
	var foundSchedule bool
	for _, sch := range sharedResp.Schedules {
		if sch.ID == "sch-sensitive" {
			foundSchedule = true
			if sch.GuideMemo == "CONFIRM-998811" || sch.GuideMemo == "" {
				t.Errorf("GuideMemo was not properly masked: %s", sch.GuideMemo)
			}
			if sch.GuideMemo != "CON••••" {
				t.Errorf("GuideMemo masked output mismatch: got %s, want CON••••", sch.GuideMemo)
			}
			if sch.TransportMemo != "BUS••••" {
				t.Errorf("TransportMemo masked output mismatch: got %s, want BUS••••", sch.TransportMemo)
			}
		}
	}
	if !foundSchedule {
		t.Errorf("sensitive schedule not found in shared response")
	}

	// 7. 비행편 메모 마스킹 검증
	var foundFlight bool
	for _, fl := range sharedResp.Flights {
		if fl.ID == "fl-sensitive" {
			foundFlight = true
			if fl.Memo == "티켓번호 777-1234-5678" || fl.Memo == "" {
				t.Errorf("Flight Memo was not properly masked: %s", fl.Memo)
			}
			if fl.Memo != "티켓번••••" {
				t.Errorf("Flight Memo masked output mismatch: got %s, want 티켓번••••", fl.Memo)
			}
		}
	}
	if !foundFlight {
		t.Errorf("sensitive flight not found in shared response")
	}
}
