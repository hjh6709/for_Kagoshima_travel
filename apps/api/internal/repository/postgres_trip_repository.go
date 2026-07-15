package repository

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/hanjeonghyun/for-kagoshima-travel/apps/api/internal/model"
)

type PostgresTripRepository struct {
	pool *pgxpool.Pool
}

func NewPostgresTripRepository(pool *pgxpool.Pool) *PostgresTripRepository {
	return &PostgresTripRepository{pool: pool}
}

func (r *PostgresTripRepository) FindTrip(id string) (model.Trip, error) {
	row := r.pool.QueryRow(context.Background(),
		`SELECT id::text, owner_id::text, title, start_date::text, end_date::text, travelers, destination_country, COALESCE(memo,'') FROM trips WHERE id = $1`, id)

	var t model.Trip
	if err := row.Scan(&t.ID, &t.OwnerID, &t.Title, &t.StartDate, &t.EndDate, &t.Travelers, &t.DestinationCountry, &t.Memo); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return model.Trip{}, ErrNotFound
		}
		return model.Trip{}, err
	}
	return t, nil
}

func (r *PostgresTripRepository) FindByOwner(ownerID string) ([]model.Trip, error) {
	rows, err := r.pool.Query(context.Background(),
		`SELECT id::text, owner_id::text, title, start_date::text, end_date::text, travelers, destination_country, COALESCE(memo,'') FROM trips WHERE owner_id = $1 ORDER BY start_date`, ownerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]model.Trip, 0)
	for rows.Next() {
		var t model.Trip
		if err := rows.Scan(&t.ID, &t.OwnerID, &t.Title, &t.StartDate, &t.EndDate, &t.Travelers, &t.DestinationCountry, &t.Memo); err != nil {
			return nil, err
		}
		result = append(result, t)
	}
	return result, rows.Err()
}

func (r *PostgresTripRepository) FindShareLinkByToken(token string) (model.ShareLink, error) {
	row := r.pool.QueryRow(context.Background(),
		`SELECT id::text, trip_id::text, token, created_at, expires_at
		 FROM share_links
		 WHERE token = $1 AND (expires_at IS NULL OR expires_at > NOW())`, token)

	var link model.ShareLink
	if err := row.Scan(&link.ID, &link.TripID, &link.Token, &link.CreatedAt, &link.ExpiresAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return model.ShareLink{}, ErrNotFound
		}
		return model.ShareLink{}, err
	}
	return link, nil
}

func (r *PostgresTripRepository) Save(trip model.Trip) error {
	_, err := r.pool.Exec(context.Background(),
		`INSERT INTO trips (id, owner_id, title, start_date, end_date, travelers, destination_country, memo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		trip.ID, trip.OwnerID, trip.Title, trip.StartDate, trip.EndDate, trip.Travelers, trip.DestinationCountry, trip.Memo)
	return err
}

func (r *PostgresTripRepository) SaveShareLink(link model.ShareLink) error {
	_, err := r.pool.Exec(context.Background(),
		`INSERT INTO share_links (id, trip_id, token, created_at, expires_at) VALUES ($1,$2,$3,$4,$5)`,
		link.ID, link.TripID, link.Token, link.CreatedAt, link.ExpiresAt)
	return err
}

func (r *PostgresTripRepository) SaveSchedule(schedule model.Schedule) error {
	var placeID any
	if schedule.PlaceID != "" {
		placeID = schedule.PlaceID
	}
	_, err := r.pool.Exec(context.Background(),
		`INSERT INTO schedules (id, trip_id, place_id, date, time, type, title, transport_memo, guide_memo)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
		schedule.ID, schedule.TripID, placeID, schedule.Date, schedule.Time, schedule.Type, schedule.Title,
		schedule.TransportMemo, schedule.GuideMemo)
	return err
}

// FindSchedule은 PATCH 전에 기존 일정 값을 보존하기 위해 단건을 조회한다.
func (r *PostgresTripRepository) FindSchedule(tripID, scheduleID string) (model.Schedule, error) {
	row := r.pool.QueryRow(context.Background(),
		`SELECT id::text, trip_id::text, COALESCE(place_id::text,''), date::text, time, type, title,
		        COALESCE(transport_memo,''), COALESCE(guide_memo,'')
		 FROM schedules WHERE trip_id = $1 AND id = $2`, tripID, scheduleID)

	var schedule model.Schedule
	if err := row.Scan(&schedule.ID, &schedule.TripID, &schedule.PlaceID, &schedule.Date, &schedule.Time,
		&schedule.Type, &schedule.Title, &schedule.TransportMemo, &schedule.GuideMemo); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return model.Schedule{}, ErrNotFound
		}
		return model.Schedule{}, err
	}
	return schedule, nil
}

// UpdateSchedule은 schedules 스키마에 있는 컬럼만 수정한다. place_id가 비어 있으면 NULL로 저장해 장소 연결을 해제한다.
func (r *PostgresTripRepository) UpdateSchedule(schedule model.Schedule) error {
	var placeID any
	if schedule.PlaceID != "" {
		placeID = schedule.PlaceID
	}
	tag, err := r.pool.Exec(context.Background(),
		`UPDATE schedules
		 SET place_id = $1, date = $2, time = $3, type = $4, title = $5,
		     transport_memo = $6, guide_memo = $7
		 WHERE trip_id = $8 AND id = $9`,
		placeID, schedule.Date, schedule.Time, schedule.Type, schedule.Title,
		schedule.TransportMemo, schedule.GuideMemo, schedule.TripID, schedule.ID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *PostgresTripRepository) SavePlace(place model.Place) error {
	_, err := r.pool.Exec(context.Background(),
		`INSERT INTO places (id, trip_id, name, category, address, google_maps_url, recommended_reason)
		 VALUES ($1,$2,$3,$4,$5,$6,$7)`,
		place.ID, place.TripID, place.Name, place.Category, place.Address, place.GoogleMapsURL, place.RecommendedReason)
	return err
}

// FindPlace는 PATCH 전에 기존 장소 값을 유지하기 위해 단건을 조회한다.
func (r *PostgresTripRepository) FindPlace(tripID, placeID string) (model.Place, error) {
	row := r.pool.QueryRow(context.Background(),
		`SELECT id::text, trip_id::text, name, category, COALESCE(address,''),
		        COALESCE(google_maps_url,''), COALESCE(recommended_reason,'')
		 FROM places WHERE trip_id = $1 AND id = $2`, tripID, placeID)

	var place model.Place
	if err := row.Scan(&place.ID, &place.TripID, &place.Name, &place.Category, &place.Address,
		&place.GoogleMapsURL, &place.RecommendedReason); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return model.Place{}, ErrNotFound
		}
		return model.Place{}, err
	}
	return place, nil
}

// UpdatePlace는 places 스키마에 실제로 존재하는 컬럼만 수정한다.
func (r *PostgresTripRepository) UpdatePlace(place model.Place) error {
	tag, err := r.pool.Exec(context.Background(),
		`UPDATE places
		 SET name = $1, category = $2, address = $3, google_maps_url = $4, recommended_reason = $5
		 WHERE trip_id = $6 AND id = $7`,
		place.Name, place.Category, place.Address, place.GoogleMapsURL, place.RecommendedReason,
		place.TripID, place.ID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *PostgresTripRepository) SaveFlight(flight model.Flight) error {
	var arrivalDate any
	if flight.ArrivalDate != "" {
		arrivalDate = flight.ArrivalDate
	}
	_, err := r.pool.Exec(context.Background(),
		`INSERT INTO flights (
			id, trip_id, direction, label, airline, flight_number,
			departure_airport, arrival_airport, departure_date, departure_time,
			arrival_date, arrival_time, memo
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
		flight.ID, flight.TripID, flight.Direction, flight.Label, flight.Airline, flight.FlightNumber,
		flight.DepartureAirport, flight.ArrivalAirport, flight.DepartureDate, flight.DepartureTime,
		arrivalDate, flight.ArrivalTime, flight.Memo)
	return err
}

// FindFlight는 PATCH 전에 기존 항공편 값을 유지하기 위해 단건을 조회한다.
func (r *PostgresTripRepository) FindFlight(tripID, flightID string) (model.Flight, error) {
	row := r.pool.QueryRow(context.Background(),
		`SELECT id::text, trip_id::text, direction, label, COALESCE(airline,''), COALESCE(flight_number,''),
		        departure_airport, arrival_airport, departure_date::text, departure_time,
		        COALESCE(arrival_date::text,''), COALESCE(arrival_time,''), COALESCE(memo,'')
		 FROM flights WHERE trip_id = $1 AND id = $2`, tripID, flightID)

	var flight model.Flight
	if err := row.Scan(&flight.ID, &flight.TripID, &flight.Direction, &flight.Label, &flight.Airline,
		&flight.FlightNumber, &flight.DepartureAirport, &flight.ArrivalAirport, &flight.DepartureDate,
		&flight.DepartureTime, &flight.ArrivalDate, &flight.ArrivalTime, &flight.Memo); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return model.Flight{}, ErrNotFound
		}
		return model.Flight{}, err
	}
	return flight, nil
}

// UpdateFlight는 flights 스키마에 실제로 존재하는 컬럼만 수정한다. arrival_date가 비어 있으면 NULL로 저장한다.
func (r *PostgresTripRepository) UpdateFlight(flight model.Flight) error {
	var arrivalDate any
	if flight.ArrivalDate != "" {
		arrivalDate = flight.ArrivalDate
	}
	tag, err := r.pool.Exec(context.Background(),
		`UPDATE flights
		 SET direction = $1, label = $2, airline = $3, flight_number = $4,
		     departure_airport = $5, arrival_airport = $6, departure_date = $7, departure_time = $8,
		     arrival_date = $9, arrival_time = $10, memo = $11
		 WHERE trip_id = $12 AND id = $13`,
		flight.Direction, flight.Label, flight.Airline, flight.FlightNumber, flight.DepartureAirport,
		flight.ArrivalAirport, flight.DepartureDate, flight.DepartureTime, arrivalDate, flight.ArrivalTime,
		flight.Memo, flight.TripID, flight.ID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *PostgresTripRepository) DeleteSchedule(tripID, scheduleID string) error {
	tag, err := r.pool.Exec(context.Background(), `DELETE FROM schedules WHERE trip_id = $1 AND id = $2`, tripID, scheduleID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *PostgresTripRepository) DeletePlace(tripID, placeID string) error {
	tag, err := r.pool.Exec(context.Background(), `DELETE FROM places WHERE trip_id = $1 AND id = $2`, tripID, placeID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *PostgresTripRepository) DeleteFlight(tripID, flightID string) error {
	// WHERE 절에 trip_id를 함께 둬서 다른 여행의 항공편을 실수로 지우지 않게 한다.
	tag, err := r.pool.Exec(context.Background(), `DELETE FROM flights WHERE trip_id = $1 AND id = $2`, tripID, flightID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *PostgresTripRepository) Update(trip model.Trip) error {
	tag, err := r.pool.Exec(context.Background(),
		`UPDATE trips SET title=$1, start_date=$2, end_date=$3, travelers=$4, destination_country=$5, memo=$6, updated_at=NOW() WHERE id=$7`,
		trip.Title, trip.StartDate, trip.EndDate, trip.Travelers, trip.DestinationCountry, trip.Memo, trip.ID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *PostgresTripRepository) Delete(id string) error {
	tag, err := r.pool.Exec(context.Background(), `DELETE FROM trips WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *PostgresTripRepository) FindSchedules(tripID string) ([]model.Schedule, error) {
	rows, err := r.pool.Query(context.Background(),
		`SELECT id::text, trip_id::text, COALESCE(place_id::text,''), date::text, time, type, title,
		        COALESCE(transport_memo,''), COALESCE(guide_memo,'')
		 FROM schedules WHERE trip_id = $1 ORDER BY date, sort_order`, tripID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]model.Schedule, 0)
	for rows.Next() {
		var s model.Schedule
		if err := rows.Scan(&s.ID, &s.TripID, &s.PlaceID, &s.Date, &s.Time, &s.Type, &s.Title,
			&s.TransportMemo, &s.GuideMemo); err != nil {
			return nil, err
		}
		result = append(result, s)
	}
	return result, rows.Err()
}

func (r *PostgresTripRepository) FindPlaces(tripID string) ([]model.Place, error) {
	rows, err := r.pool.Query(context.Background(),
		`SELECT id::text, trip_id::text, name, category, COALESCE(address,''),
		        COALESCE(google_maps_url,''), COALESCE(recommended_reason,'')
		 FROM places WHERE trip_id = $1 ORDER BY category`, tripID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]model.Place, 0)
	for rows.Next() {
		var p model.Place
		if err := rows.Scan(&p.ID, &p.TripID, &p.Name, &p.Category, &p.Address,
			&p.GoogleMapsURL, &p.RecommendedReason); err != nil {
			return nil, err
		}
		result = append(result, p)
	}
	return result, rows.Err()
}

func (r *PostgresTripRepository) FindFlights(tripID string) ([]model.Flight, error) {
	rows, err := r.pool.Query(context.Background(),
		`SELECT id::text, trip_id::text, direction, label, COALESCE(airline,''), COALESCE(flight_number,''),
		        departure_airport, arrival_airport, departure_date::text, departure_time,
		        COALESCE(arrival_date::text,''), COALESCE(arrival_time,''), COALESCE(memo,'')
		 FROM flights WHERE trip_id = $1 ORDER BY departure_date, sort_order, departure_time`, tripID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]model.Flight, 0)
	for rows.Next() {
		var f model.Flight
		if err := rows.Scan(&f.ID, &f.TripID, &f.Direction, &f.Label, &f.Airline, &f.FlightNumber,
			&f.DepartureAirport, &f.ArrivalAirport, &f.DepartureDate, &f.DepartureTime,
			&f.ArrivalDate, &f.ArrivalTime, &f.Memo); err != nil {
			return nil, err
		}
		result = append(result, f)
	}
	return result, rows.Err()
}

func (r *PostgresTripRepository) FindRoutes(tripID string) ([]model.Route, error) {
	rows, err := r.pool.Query(context.Background(),
		`SELECT r.id::text, r.title, COALESCE(r.description,''), COALESCE(r.transport_memo,''),
		        COALESCE(r.estimated_duration,''),
		        COALESCE(array_agg(rp.place_id::text ORDER BY rp.sort_order) FILTER (WHERE rp.place_id IS NOT NULL), '{}')
		 FROM routes r
		 LEFT JOIN route_places rp ON rp.route_id = r.id
		 WHERE r.trip_id = $1
		 GROUP BY r.id ORDER BY r.id`, tripID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]model.Route, 0)
	for rows.Next() {
		var ro model.Route
		ro.TripID = tripID
		if err := rows.Scan(&ro.ID, &ro.Title, &ro.Description, &ro.TransportMemo,
			&ro.EstimatedDuration, &ro.PlaceIDs); err != nil {
			return nil, err
		}
		result = append(result, ro)
	}
	return result, rows.Err()
}
