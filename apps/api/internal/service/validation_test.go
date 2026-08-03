package service

import "testing"

func TestValidateFlightDatesAllowsInternationalDateLineCrossing(t *testing.T) {
	tests := []struct {
		name          string
		departureDate string
		arrivalDate   string
		want          bool
	}{
		{name: "same local date", departureDate: "2026-08-03", arrivalDate: "2026-08-03", want: true},
		{name: "later local date", departureDate: "2026-08-03", arrivalDate: "2026-08-04", want: true},
		{name: "date line previous day", departureDate: "2026-08-03", arrivalDate: "2026-08-02", want: true},
		{name: "two days earlier", departureDate: "2026-08-03", arrivalDate: "2026-08-01", want: false},
		{name: "invalid departure", departureDate: "2026-02-30", arrivalDate: "2026-03-01", want: false},
		{name: "invalid arrival", departureDate: "2026-08-03", arrivalDate: "tomorrow", want: false},
		{name: "optional arrival", departureDate: "2026-08-03", arrivalDate: "", want: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := validateFlightDates(tt.departureDate, tt.arrivalDate); got != tt.want {
				t.Fatalf("validateFlightDates(%q, %q) = %v, want %v", tt.departureDate, tt.arrivalDate, got, tt.want)
			}
		})
	}
}
