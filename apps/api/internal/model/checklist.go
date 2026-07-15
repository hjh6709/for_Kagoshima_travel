package model

import "time"

type ChecklistItem struct {
	ID                 string    `db:"id"`
	TripID             string    `db:"trip_id"`
	Category           string    `db:"category"`
	Title              string    `db:"title"`
	IsCompleted        bool      `db:"is_completed"`
	Custom             bool      `db:"custom"`
	DestinationCountry string    `db:"destination_country"`
	CreatedAt          time.Time `db:"created_at"`
}
