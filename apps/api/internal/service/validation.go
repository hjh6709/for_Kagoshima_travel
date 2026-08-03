package service

import (
	"strings"
	"time"
	"unicode/utf8"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/model"
)

const maxTitleRunes = 120

func normalizeRequiredText(value string, maxRunes int) (string, bool) {
	value = strings.TrimSpace(value)
	return value, value != "" && utf8.RuneCountInString(value) <= maxRunes
}

func parseISODate(value string) (time.Time, bool) {
	if value == "" {
		return time.Time{}, false
	}
	date, err := time.Parse("2006-01-02", value)
	return date, err == nil && date.Format("2006-01-02") == value
}

func validateDateRange(startDate, endDate string) bool {
	start, startOK := parseISODate(startDate)
	end, endOK := parseISODate(endDate)
	return startOK && endOK && !end.Before(start)
}

func isDateWithinTrip(value string, trip model.Trip) bool {
	date, dateOK := parseISODate(value)
	start, startOK := parseISODate(trip.StartDate)
	end, endOK := parseISODate(trip.EndDate)
	return dateOK && startOK && endOK && !date.Before(start) && !date.After(end)
}

func normalizeCountryCode(value string) (string, bool) {
	value = strings.ToUpper(strings.TrimSpace(value))
	if value == "" {
		return "JP", true
	}
	if len(value) != 2 || value[0] < 'A' || value[0] > 'Z' || value[1] < 'A' || value[1] > 'Z' {
		return "", false
	}
	return value, true
}

func validCoordinates(latitude, longitude *float64) bool {
	if latitude == nil && longitude == nil {
		return true
	}
	if latitude == nil || longitude == nil {
		return false
	}
	return *latitude >= -90 && *latitude <= 90 && *longitude >= -180 && *longitude <= 180
}

func validateFlightDates(departureDate, arrivalDate string) bool {
	departure, departureOK := parseISODate(departureDate)
	if !departureOK {
		return false
	}
	if arrivalDate == "" {
		return true
	}
	arrival, arrivalOK := parseISODate(arrivalDate)
	return arrivalOK && !arrival.Before(departure)
}
