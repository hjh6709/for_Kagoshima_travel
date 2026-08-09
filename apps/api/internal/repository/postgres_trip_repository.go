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
	ctx  context.Context
}

func NewPostgresTripRepository(pool *pgxpool.Pool) *PostgresTripRepository {
	return &PostgresTripRepository{pool: pool}
}

func (r *PostgresTripRepository) WithContext(ctx context.Context) TripRepository {
	return &PostgresTripRepository{pool: r.pool, ctx: ctx}
}

func (r *PostgresTripRepository) context() context.Context {
	if r.ctx != nil {
		return r.ctx
	}
	return context.Background()
}

func (r *PostgresTripRepository) FindTrip(id string) (model.Trip, error) {
	row := r.pool.QueryRow(r.context(),
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
	rows, err := r.pool.Query(r.context(),
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

func (r *PostgresTripRepository) FindSummariesByOwner(ownerID string) ([]TripSummary, error) {
	rows, err := r.pool.Query(r.context(), `
		WITH owner_trips AS (
			SELECT id, owner_id, title, start_date, end_date, travelers, destination_country, memo
			FROM trips
			WHERE owner_id = $1
		), place_counts AS (
			SELECT p.trip_id, COUNT(*)::int AS child_count
			FROM places p
			JOIN owner_trips t ON t.id = p.trip_id
			GROUP BY p.trip_id
		), schedule_counts AS (
			SELECT s.trip_id, COUNT(*)::int AS child_count
			FROM schedules s
			JOIN owner_trips t ON t.id = s.trip_id
			GROUP BY s.trip_id
		), flight_counts AS (
			SELECT f.trip_id, COUNT(*)::int AS child_count
			FROM flights f
			JOIN owner_trips t ON t.id = f.trip_id
			GROUP BY f.trip_id
		)
		SELECT t.id::text, t.owner_id::text, t.title, t.start_date::text, t.end_date::text,
		       t.travelers, t.destination_country, COALESCE(t.memo,''),
		       COALESCE(p.child_count, 0), COALESCE(s.child_count, 0), COALESCE(f.child_count, 0)
		FROM owner_trips t
		LEFT JOIN place_counts p ON p.trip_id = t.id
		LEFT JOIN schedule_counts s ON s.trip_id = t.id
		LEFT JOIN flight_counts f ON f.trip_id = t.id
		ORDER BY t.start_date`, ownerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]TripSummary, 0)
	for rows.Next() {
		var summary TripSummary
		trip := &summary.Trip
		if err := rows.Scan(
			&trip.ID,
			&trip.OwnerID,
			&trip.Title,
			&trip.StartDate,
			&trip.EndDate,
			&trip.Travelers,
			&trip.DestinationCountry,
			&trip.Memo,
			&summary.PlaceCount,
			&summary.ScheduleCount,
			&summary.FlightCount,
		); err != nil {
			return nil, err
		}
		result = append(result, summary)
	}
	return result, rows.Err()
}

func (r *PostgresTripRepository) FindShareLinkByToken(token string) (model.ShareLink, error) {
	row := r.pool.QueryRow(r.context(),
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
	_, err := r.pool.Exec(r.context(),
		`INSERT INTO trips (id, owner_id, title, start_date, end_date, travelers, destination_country, memo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		trip.ID, trip.OwnerID, trip.Title, trip.StartDate, trip.EndDate, trip.Travelers, trip.DestinationCountry, trip.Memo)
	return err
}

func (r *PostgresTripRepository) SaveTripWithChecklist(ctx context.Context, trip model.Trip, items []model.ChecklistItem) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(context.WithoutCancel(ctx)) }()

	if _, err := tx.Exec(ctx,
		`INSERT INTO trips (id, owner_id, title, start_date, end_date, travelers, destination_country, memo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		trip.ID, trip.OwnerID, trip.Title, trip.StartDate, trip.EndDate, trip.Travelers, trip.DestinationCountry, trip.Memo,
	); err != nil {
		return err
	}
	for _, item := range items {
		var destinationCountry any
		if item.DestinationCountry != "" {
			destinationCountry = item.DestinationCountry
		}
		var scheduledDate any
		if item.ScheduledDate != "" {
			scheduledDate = item.ScheduledDate
		}
		if _, err := tx.Exec(ctx,
			`INSERT INTO checklists (id, trip_id, category, title, is_completed, custom, destination_country, scheduled_date, created_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
			item.ID, item.TripID, item.Category, item.Title, item.IsCompleted, item.Custom, destinationCountry, scheduledDate, item.CreatedAt,
		); err != nil {
			return mapPostgresWriteError(err)
		}
	}
	return tx.Commit(ctx)
}

func (r *PostgresTripRepository) SaveShareLink(link model.ShareLink) error {
	ctx := r.context()
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(context.WithoutCancel(ctx)) }()

	// 이전 링크 무효화와 새 링크 저장은 반드시 함께 성공하거나 함께 취소합니다.
	if _, err := tx.Exec(ctx, `DELETE FROM share_links WHERE trip_id = $1`, link.TripID); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx,
		`INSERT INTO share_links (id, trip_id, token, created_at, expires_at) VALUES ($1,$2,$3,$4,$5)`,
		link.ID, link.TripID, link.Token, link.CreatedAt, link.ExpiresAt,
	); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *PostgresTripRepository) SaveSchedule(schedule model.Schedule) error {
	var placeID any
	if schedule.PlaceID != "" {
		placeID = schedule.PlaceID
	}
	_, err := r.pool.Exec(r.context(),
		`INSERT INTO schedules (id, trip_id, place_id, date, time, type, title, transport_memo, guide_memo)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
		schedule.ID, schedule.TripID, placeID, schedule.Date, schedule.Time, schedule.Type, schedule.Title,
		schedule.TransportMemo, schedule.GuideMemo)
	return mapPostgresWriteError(err)
}

// FindSchedule은 PATCH 전에 기존 일정 값을 보존하기 위해 단건을 조회한다.
func (r *PostgresTripRepository) FindSchedule(tripID, scheduleID string) (model.Schedule, error) {
	row := r.pool.QueryRow(r.context(),
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
	tag, err := r.pool.Exec(r.context(),
		`UPDATE schedules
		 SET place_id = $1, date = $2, time = $3, type = $4, title = $5,
		     transport_memo = $6, guide_memo = $7
		 WHERE trip_id = $8 AND id = $9`,
		placeID, schedule.Date, schedule.Time, schedule.Type, schedule.Title,
		schedule.TransportMemo, schedule.GuideMemo, schedule.TripID, schedule.ID)
	if err != nil {
		return mapPostgresWriteError(err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *PostgresTripRepository) SavePlace(place model.Place) error {
	_, err := r.pool.Exec(r.context(),
		`INSERT INTO places (id, trip_id, name, category, address, google_maps_url, recommended_reason, 
		                     latitude, longitude, google_place_id, chinese_name, chinese_address, subway_exit, taxi_phrase)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
		place.ID, place.TripID, place.Name, place.Category, place.Address, place.GoogleMapsURL, place.RecommendedReason,
		place.Latitude, place.Longitude, place.GooglePlaceID, place.ChineseName, place.ChineseAddress, place.SubwayExit, place.TaxiPhrase)
	return err
}

// FindPlace는 PATCH 전에 기존 장소 값을 유지하기 위해 단건을 조회한다.
func (r *PostgresTripRepository) FindPlace(tripID, placeID string) (model.Place, error) {
	row := r.pool.QueryRow(r.context(),
		`SELECT id::text, trip_id::text, name, category, COALESCE(address,''),
		        COALESCE(google_maps_url,''), COALESCE(recommended_reason,''),
		        latitude, longitude, COALESCE(google_place_id,''), COALESCE(chinese_name,''),
		        COALESCE(chinese_address,''), COALESCE(subway_exit,''), COALESCE(taxi_phrase,'')
		 FROM places WHERE trip_id = $1 AND id = $2`, tripID, placeID)

	var place model.Place
	if err := row.Scan(&place.ID, &place.TripID, &place.Name, &place.Category, &place.Address,
		&place.GoogleMapsURL, &place.RecommendedReason, &place.Latitude, &place.Longitude,
		&place.GooglePlaceID, &place.ChineseName, &place.ChineseAddress, &place.SubwayExit, &place.TaxiPhrase); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return model.Place{}, ErrNotFound
		}
		return model.Place{}, err
	}
	return place, nil
}

// UpdatePlace는 places 스키마에 실제로 존재하는 컬럼만 수정한다.
func (r *PostgresTripRepository) UpdatePlace(place model.Place) error {
	tag, err := r.pool.Exec(r.context(),
		`UPDATE places
		 SET name = $1, category = $2, address = $3, google_maps_url = $4, recommended_reason = $5,
		     latitude = $6, longitude = $7, google_place_id = $8, chinese_name = $9, chinese_address = $10,
		     subway_exit = $11, taxi_phrase = $12
		 WHERE trip_id = $13 AND id = $14`,
		place.Name, place.Category, place.Address, place.GoogleMapsURL, place.RecommendedReason,
		place.Latitude, place.Longitude, place.GooglePlaceID, place.ChineseName, place.ChineseAddress,
		place.SubwayExit, place.TaxiPhrase, place.TripID, place.ID)
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
	_, err := r.pool.Exec(r.context(),
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
	row := r.pool.QueryRow(r.context(),
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
	tag, err := r.pool.Exec(r.context(),
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
	tag, err := r.pool.Exec(r.context(), `DELETE FROM schedules WHERE trip_id = $1 AND id = $2`, tripID, scheduleID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *PostgresTripRepository) DeletePlace(tripID, placeID string) error {
	tag, err := r.pool.Exec(r.context(), `DELETE FROM places WHERE trip_id = $1 AND id = $2`, tripID, placeID)
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
	tag, err := r.pool.Exec(r.context(), `DELETE FROM flights WHERE trip_id = $1 AND id = $2`, tripID, flightID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *PostgresTripRepository) ConsumeMonthlyAPIRequest(provider, periodStart string, limit int) (bool, error) {
	row := r.pool.QueryRow(r.context(), `
		WITH consumed AS (
			INSERT INTO external_api_monthly_usage (provider, period_start, request_count)
			VALUES ($1, $2::date, 1)
			ON CONFLICT (provider, period_start) DO UPDATE
			SET request_count = external_api_monthly_usage.request_count + 1,
			    updated_at = NOW()
			WHERE external_api_monthly_usage.request_count < $3
			RETURNING request_count
		)
		SELECT EXISTS(SELECT 1 FROM consumed)
	`, provider, periodStart, limit)
	var consumed bool
	if err := row.Scan(&consumed); err != nil {
		return false, err
	}
	return consumed, nil
}

func (r *PostgresTripRepository) Update(trip model.Trip) error {
	tag, err := r.pool.Exec(r.context(),
		`UPDATE trips SET title=$1, start_date=$2, end_date=$3, travelers=$4, destination_country=$5, memo=$6, updated_at=NOW() WHERE id=$7`,
		trip.Title, trip.StartDate, trip.EndDate, trip.Travelers, trip.DestinationCountry, trip.Memo, trip.ID)
	if err != nil {
		return mapPostgresWriteError(err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *PostgresTripRepository) Delete(id string) error {
	tag, err := r.pool.Exec(r.context(), `DELETE FROM trips WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *PostgresTripRepository) FindSchedules(tripID string) ([]model.Schedule, error) {
	rows, err := r.pool.Query(r.context(),
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
	rows, err := r.pool.Query(r.context(),
		`SELECT id::text, trip_id::text, name, category, COALESCE(address,''),
		        COALESCE(google_maps_url,''), COALESCE(recommended_reason,''),
		        latitude, longitude, COALESCE(google_place_id,''), COALESCE(chinese_name,''),
		        COALESCE(chinese_address,''), COALESCE(subway_exit,''), COALESCE(taxi_phrase,'')
		 FROM places WHERE trip_id = $1 ORDER BY category`, tripID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]model.Place, 0)
	for rows.Next() {
		var p model.Place
		if err := rows.Scan(&p.ID, &p.TripID, &p.Name, &p.Category, &p.Address,
			&p.GoogleMapsURL, &p.RecommendedReason, &p.Latitude, &p.Longitude,
			&p.GooglePlaceID, &p.ChineseName, &p.ChineseAddress, &p.SubwayExit, &p.TaxiPhrase); err != nil {
			return nil, err
		}
		result = append(result, p)
	}
	return result, rows.Err()
}

func (r *PostgresTripRepository) FindFlights(tripID string) ([]model.Flight, error) {
	rows, err := r.pool.Query(r.context(),
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
	rows, err := r.pool.Query(r.context(),
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
