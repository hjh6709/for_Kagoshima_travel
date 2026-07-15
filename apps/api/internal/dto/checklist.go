package dto

type ChecklistItemResponse struct {
	ID                 string `json:"id"`
	Category           string `json:"category"`
	Title              string `json:"title"`
	IsCompleted        bool   `json:"isCompleted"`
	Custom             bool   `json:"custom"`
	DestinationCountry string `json:"destinationCountry,omitempty"`
}

type CreateChecklistItemRequest struct {
	Category string `json:"category"`
	Title    string `json:"title"`
}

type UpdateChecklistItemRequest struct {
	Title       *string `json:"title,omitempty"`
	IsCompleted *bool   `json:"isCompleted,omitempty"`
}
