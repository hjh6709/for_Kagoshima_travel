package dto

type CreateTripRequest struct {
	Title              string   `json:"title"`
	StartDate          string   `json:"startDate"`
	EndDate            string   `json:"endDate"`
	Travelers          []string `json:"travelers"`
	DestinationCountry string   `json:"destinationCountry"`
	Memo               string   `json:"memo"`
}

type UpdateTripRequest struct {
	Title              *string  `json:"title"`
	StartDate          *string  `json:"startDate"`
	EndDate            *string  `json:"endDate"`
	Travelers          []string `json:"travelers"`
	DestinationCountry *string  `json:"destinationCountry"`
	Memo               *string  `json:"memo"`
}

type CreateScheduleRequest struct {
	PlaceID       string `json:"placeId"`
	Date          string `json:"date"`
	Time          string `json:"time"`
	Type          string `json:"type"`
	Title         string `json:"title"`
	TransportMemo string `json:"transportMemo"`
	GuideMemo     string `json:"guideMemo"`
}

// UpdateScheduleRequest는 PATCH 요청에서 들어온 필드만 수정하기 위해 포인터로 받는다.
type UpdateScheduleRequest struct {
	PlaceID       *string `json:"placeId"`
	Date          *string `json:"date"`
	Time          *string `json:"time"`
	Type          *string `json:"type"`
	Title         *string `json:"title"`
	TransportMemo *string `json:"transportMemo"`
	GuideMemo     *string `json:"guideMemo"`
}

type CreatePlaceRequest struct {
	Name              string   `json:"name"`
	Category          string   `json:"category"`
	Address           string   `json:"address"`
	GoogleMapsURL     string   `json:"googleMapsUrl"`
	RecommendedReason string   `json:"recommendedReason"`
	Latitude          *float64 `json:"latitude"`
	Longitude         *float64 `json:"longitude"`
	GooglePlaceID     string   `json:"googlePlaceId"`
	ChineseName       string   `json:"chineseName"`
	ChineseAddress    string   `json:"chineseAddress"`
	SubwayExit        string   `json:"subwayExit"`
	TaxiPhrase        string   `json:"taxiPhrase"`
}

// UpdatePlaceRequest는 장소 수정 화면에서 바뀐 필드만 PATCH로 보낼 수 있게 포인터로 받는다.
type UpdatePlaceRequest struct {
	Name              *string  `json:"name"`
	Category          *string  `json:"category"`
	Address           *string  `json:"address"`
	GoogleMapsURL     *string  `json:"googleMapsUrl"`
	RecommendedReason *string  `json:"recommendedReason"`
	Latitude          *float64 `json:"latitude"`
	Longitude         *float64 `json:"longitude"`
	GooglePlaceID     *string  `json:"googlePlaceId"`
	ChineseName       *string  `json:"chineseName"`
	ChineseAddress    *string  `json:"chineseAddress"`
	SubwayExit        *string  `json:"subwayExit"`
	TaxiPhrase        *string  `json:"taxiPhrase"`
}

type CreateFlightRequest struct {
	Direction        string `json:"direction"`
	Label            string `json:"label"`
	Airline          string `json:"airline"`
	FlightNumber     string `json:"flightNumber"`
	DepartureAirport string `json:"departureAirport"`
	ArrivalAirport   string `json:"arrivalAirport"`
	DepartureDate    string `json:"departureDate"`
	DepartureTime    string `json:"departureTime"`
	ArrivalDate      string `json:"arrivalDate"`
	ArrivalTime      string `json:"arrivalTime"`
	Memo             string `json:"memo"`
}

// UpdateFlightRequest는 항공편 수정 화면에서 전달된 필드만 바꾸기 위해 포인터로 받는다.
type UpdateFlightRequest struct {
	Direction        *string `json:"direction"`
	Label            *string `json:"label"`
	Airline          *string `json:"airline"`
	FlightNumber     *string `json:"flightNumber"`
	DepartureAirport *string `json:"departureAirport"`
	ArrivalAirport   *string `json:"arrivalAirport"`
	DepartureDate    *string `json:"departureDate"`
	DepartureTime    *string `json:"departureTime"`
	ArrivalDate      *string `json:"arrivalDate"`
	ArrivalTime      *string `json:"arrivalTime"`
	Memo             *string `json:"memo"`
}

type TripResponse struct {
	ID                 string   `json:"id"`
	Title              string   `json:"title"`
	StartDate          string   `json:"startDate"`
	EndDate            string   `json:"endDate"`
	Travelers          []string `json:"travelers"`
	DestinationCountry string   `json:"destinationCountry"`
	Memo               string   `json:"memo,omitempty"`
}

type PublicTripResponse struct {
	ID                 string   `json:"id"`
	Title              string   `json:"title"`
	StartDate          string   `json:"startDate"`
	EndDate            string   `json:"endDate"`
	Travelers          []string `json:"travelers"`
	DestinationCountry string   `json:"destinationCountry"`
}

type ScheduleResponse struct {
	ID            string `json:"id"`
	PlaceID       string `json:"placeId,omitempty"`
	Date          string `json:"date"`
	Time          string `json:"time"`
	Type          string `json:"type"`
	Title         string `json:"title"`
	TransportMemo string `json:"transportMemo,omitempty"`
	GuideMemo     string `json:"guideMemo,omitempty"`
}

type PlaceResponse struct {
	ID                string   `json:"id"`
	Name              string   `json:"name"`
	Category          string   `json:"category"`
	Address           string   `json:"address,omitempty"`
	GoogleMapsURL     string   `json:"googleMapsUrl,omitempty"`
	RecommendedReason string   `json:"recommendedReason,omitempty"`
	Latitude          *float64 `json:"latitude,omitempty"`
	Longitude         *float64 `json:"longitude,omitempty"`
	GooglePlaceID     string   `json:"googlePlaceId,omitempty"`
	ChineseName       string   `json:"chineseName,omitempty"`
	ChineseAddress    string   `json:"chineseAddress,omitempty"`
	SubwayExit        string   `json:"subwayExit,omitempty"`
	TaxiPhrase        string   `json:"taxiPhrase,omitempty"`
}

type FlightResponse struct {
	ID               string `json:"id"`
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

type RouteResponse struct {
	ID                string   `json:"id"`
	Title             string   `json:"title"`
	Description       string   `json:"description,omitempty"`
	PlaceIDs          []string `json:"placeIds"`
	TransportMemo     string   `json:"transportMemo,omitempty"`
	EstimatedDuration string   `json:"estimatedDuration,omitempty"`
}

type ShareLinkResponse struct {
	Token     string `json:"token"`
	APIPath   string `json:"apiPath"`
	WebPath   string `json:"webPath"`
	ExpiresAt string `json:"expiresAt,omitempty"`
}

type SharedTripResponse struct {
	Trip      PublicTripResponse      `json:"trip"`
	Schedules []ScheduleResponse      `json:"schedules"`
	Places    []PlaceResponse         `json:"places"`
	Flights   []FlightResponse        `json:"flights"`
	Routes    []RouteResponse         `json:"routes"`
	Checklist []ChecklistItemResponse `json:"checklist"`
}
