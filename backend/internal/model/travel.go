package model

type Trip struct {
	ID        string   `json:"id"`
	Title     string   `json:"title"`
	StartDate string   `json:"startDate"`
	EndDate   string   `json:"endDate"`
	Travelers []string `json:"travelers"`
	Memo      string   `json:"memo,omitempty"`
}

type Schedule struct {
	ID            string `json:"id"`
	TripID        string `json:"tripId"`
	PlaceID       string `json:"placeId,omitempty"`
	Date          string `json:"date"`
	Time          string `json:"time"`
	Type          string `json:"type"`
	Title         string `json:"title"`
	TransportMemo string `json:"transportMemo,omitempty"`
	ParentMemo    string `json:"parentMemo,omitempty"`
}

type Place struct {
	ID                string `json:"id"`
	TripID            string `json:"tripId"`
	Name              string `json:"name"`
	Category          string `json:"category"`
	Address           string `json:"address,omitempty"`
	GoogleMapsURL     string `json:"googleMapsUrl,omitempty"`
	RecommendedReason string `json:"recommendedReason,omitempty"`
}

type Route struct {
	ID                string   `json:"id"`
	TripID            string   `json:"tripId"`
	Title             string   `json:"title"`
	Description       string   `json:"description,omitempty"`
	PlaceIDs          []string `json:"placeIds"`
	TransportMemo     string   `json:"transportMemo,omitempty"`
	EstimatedDuration string   `json:"estimatedDuration,omitempty"`
}
