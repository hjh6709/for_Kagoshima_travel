package dto

type CreateTripRequest struct {
	Title                 string   `json:"title"`
	StartDate             string   `json:"startDate"`
	EndDate               string   `json:"endDate"`
	Travelers             []string `json:"travelers"`
	DestinationCountry    string   `json:"destinationCountry"`
	Memo                  string   `json:"memo"`
	EmergencyContactName  string   `json:"emergencyContactName"`
	EmergencyContactPhone string   `json:"emergencyContactPhone"`
}

type UpdateTripRequest struct {
	Title                 *string  `json:"title"`
	StartDate             *string  `json:"startDate"`
	EndDate               *string  `json:"endDate"`
	Travelers             []string `json:"travelers"`
	DestinationCountry    *string  `json:"destinationCountry"`
	Memo                  *string  `json:"memo"`
	EmergencyContactName  *string  `json:"emergencyContactName"`
	EmergencyContactPhone *string  `json:"emergencyContactPhone"`
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
	Phone             string   `json:"phone"`
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
	Phone             *string  `json:"phone"`
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
	ID                    string   `json:"id"`
	Title                 string   `json:"title"`
	StartDate             string   `json:"startDate"`
	EndDate               string   `json:"endDate"`
	Travelers             []string `json:"travelers"`
	DestinationCountry    string   `json:"destinationCountry"`
	Memo                  string   `json:"memo,omitempty"`
	EmergencyContactName  string   `json:"emergencyContactName,omitempty"`
	EmergencyContactPhone string   `json:"emergencyContactPhone,omitempty"`
}

// TripSummaryResponse는 여행 목록 화면 전용이다.
// 상세 조회(TripResponse)에는 개수를 넣지 않는다 — 항상 0이 실려 오해를 준다.
//
// 프론트는 이 응답을 여행 목록뿐 아니라 개별 여행 화면(오늘/일정/지도/긴급 탭)의
// 유일한 데이터 소스로도 쓴다 — 상세 조회(GetTrip)가 아니라 목록에서 골라 쓴다.
// 그래서 TripResponse에만 넣고 여기 빠뜨리면, 값은 DB에 잘 저장되는데 정작
// 여행을 보는 화면에는 반영이 안 되는 조용한 버그가 생긴다(실제로 겪었다).
type TripSummaryResponse struct {
	ID                    string   `json:"id"`
	Title                 string   `json:"title"`
	StartDate             string   `json:"startDate"`
	EndDate               string   `json:"endDate"`
	Travelers             []string `json:"travelers"`
	DestinationCountry    string   `json:"destinationCountry"`
	Memo                  string   `json:"memo,omitempty"`
	EmergencyContactName  string   `json:"emergencyContactName,omitempty"`
	EmergencyContactPhone string   `json:"emergencyContactPhone,omitempty"`
	PlaceCount            int      `json:"placeCount"`
	ScheduleCount         int      `json:"scheduleCount"`
	FlightCount           int      `json:"flightCount"`
}

// PublicTripResponse는 공유 링크로 로그인 없이 보는 응답이다. 내부 메모(Memo)는
// 일부러 뺐다 — 소유자 혼잣말이 공유 화면에 노출됐던 사고 이후로 지키는 규칙이다.
//
// 긴급 연락처는 다르다. 이건 소유자만 보는 메모가 아니라 동행자가 여행 중 실제로
// 눌러 쓰는 정보라, 공유 응답에도 포함한다 — 이 기능의 존재 이유 자체가 로그인
// 없이 보는 가족에게 연락처를 보여주는 것이다.
type PublicTripResponse struct {
	ID                    string   `json:"id"`
	Title                 string   `json:"title"`
	StartDate             string   `json:"startDate"`
	EndDate               string   `json:"endDate"`
	Travelers             []string `json:"travelers"`
	DestinationCountry    string   `json:"destinationCountry"`
	EmergencyContactName  string   `json:"emergencyContactName,omitempty"`
	EmergencyContactPhone string   `json:"emergencyContactPhone,omitempty"`
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
	Phone             string   `json:"phone,omitempty"`
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

type PlaceSearchResult struct {
	Name           string   `json:"name"`
	Address        string   `json:"address,omitempty"`
	Latitude       *float64 `json:"latitude,omitempty"`
	Longitude      *float64 `json:"longitude,omitempty"`
	GooglePlaceID  string   `json:"googlePlaceId,omitempty"`
	ChineseName    string   `json:"chineseName,omitempty"`
	ChineseAddress string   `json:"chineseAddress,omitempty"`
	SubwayExit     string   `json:"subwayExit,omitempty"`
	TaxiPhrase     string   `json:"taxiPhrase,omitempty"`
}
