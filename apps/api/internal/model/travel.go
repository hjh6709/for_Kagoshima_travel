package model

type Trip struct {
	ID        string   `json:"id"`
	OwnerID   string   `json:"ownerId"`
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
	GuideMemo     string `json:"guideMemo,omitempty"`
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

type Flight struct {
	ID               string `json:"id"`
	TripID           string `json:"tripId"`
	Direction        string `json:"direction"`
	Label            string `json:"label"`
	Airline          string `json:"airline,omitempty"`
	FlightNumber     string `json:"flightNumber,omitempty"`
	DepartureAirport string `json:"departureAirport"`
	ArrivalAirport   string `json:"arrivalAirport"`
	DepartureDate    string `json:"departureDate"`
	DepartureTime    string `json:"departureTime"`
	ArrivalDate      string `json:"arrivalDate,omitempty"`
	ArrivalTime      string `json:"arrivalTime,omitempty"`
	Memo             string `json:"memo,omitempty"`
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
