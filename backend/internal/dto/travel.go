package dto

type CreateTripRequest struct {
	Title     string   `json:"title"`
	StartDate string   `json:"startDate"`
	EndDate   string   `json:"endDate"`
	Travelers []string `json:"travelers"`
	Memo      string   `json:"memo"`
}

type UpdateTripRequest struct {
	Title     *string  `json:"title"`
	StartDate *string  `json:"startDate"`
	EndDate   *string  `json:"endDate"`
	Travelers []string `json:"travelers"`
	Memo      *string  `json:"memo"`
}

type TripResponse struct {
	ID        string   `json:"id"`
	Title     string   `json:"title"`
	StartDate string   `json:"startDate"`
	EndDate   string   `json:"endDate"`
	Travelers []string `json:"travelers"`
	Memo      string   `json:"memo,omitempty"`
}

type PublicTripResponse struct {
	ID        string   `json:"id"`
	Title     string   `json:"title"`
	StartDate string   `json:"startDate"`
	EndDate   string   `json:"endDate"`
	Travelers []string `json:"travelers"`
}

type ScheduleResponse struct {
	ID            string `json:"id"`
	PlaceID       string `json:"placeId,omitempty"`
	Date          string `json:"date"`
	Time          string `json:"time"`
	Type          string `json:"type"`
	Title         string `json:"title"`
	TransportMemo string `json:"transportMemo,omitempty"`
	ParentMemo    string `json:"parentMemo,omitempty"`
}

type PlaceResponse struct {
	ID                string `json:"id"`
	Name              string `json:"name"`
	Category          string `json:"category"`
	Address           string `json:"address,omitempty"`
	GoogleMapsURL     string `json:"googleMapsUrl,omitempty"`
	RecommendedReason string `json:"recommendedReason,omitempty"`
}

type RouteResponse struct {
	ID                string   `json:"id"`
	Title             string   `json:"title"`
	Description       string   `json:"description,omitempty"`
	PlaceIDs          []string `json:"placeIds"`
	TransportMemo     string   `json:"transportMemo,omitempty"`
	EstimatedDuration string   `json:"estimatedDuration,omitempty"`
}

type ExpenseSummaryRequest struct {
	ID       string `json:"id,omitempty"`
	Label    string `json:"label"`
	Currency string `json:"currency"`
	Amount   int64  `json:"amount"`
	Note     string `json:"note,omitempty"`
}

type ReplaceExpenseSummariesRequest struct {
	Items []ExpenseSummaryRequest `json:"items"`
}

type ExpenseSummaryResponse struct {
	ID        string `json:"id"`
	Label     string `json:"label"`
	Currency  string `json:"currency"`
	Amount    int64  `json:"amount"`
	Note      string `json:"note,omitempty"`
	UpdatedAt string `json:"updatedAt"`
}

type ShareLinkResponse struct {
	Token     string `json:"token"`
	APIPath   string `json:"apiPath"`
	WebPath   string `json:"webPath"`
	ExpiresAt string `json:"expiresAt,omitempty"`
}

type SharedTripResponse struct {
	Trip             PublicTripResponse       `json:"trip"`
	Schedules        []ScheduleResponse       `json:"schedules"`
	Places           []PlaceResponse          `json:"places"`
	Routes           []RouteResponse          `json:"routes"`
	ExpenseSummaries []ExpenseSummaryResponse `json:"expenseSummaries"`
}
