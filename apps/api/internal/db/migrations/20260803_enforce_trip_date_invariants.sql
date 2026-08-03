CREATE OR REPLACE FUNCTION validate_schedule_trip_date()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    trip_start DATE;
    trip_end DATE;
BEGIN
    SELECT start_date, end_date
      INTO trip_start, trip_end
      FROM trips
     WHERE id = NEW.trip_id
     FOR UPDATE;

    IF FOUND AND (NEW.date < trip_start OR NEW.date > trip_end) THEN
        RAISE EXCEPTION 'schedule date must be within trip dates'
            USING ERRCODE = '23514', CONSTRAINT = 'schedules_within_trip_dates';
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION validate_checklist_trip_date()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    trip_start DATE;
    trip_end DATE;
BEGIN
    IF NEW.scheduled_date IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT start_date, end_date
      INTO trip_start, trip_end
      FROM trips
     WHERE id = NEW.trip_id
     FOR UPDATE;

    IF FOUND AND (NEW.scheduled_date < trip_start OR NEW.scheduled_date > trip_end) THEN
        RAISE EXCEPTION 'checklist date must be within trip dates'
            USING ERRCODE = '23514', CONSTRAINT = 'checklists_within_trip_dates';
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION validate_trip_date_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.start_date IS NOT DISTINCT FROM OLD.start_date
       AND NEW.end_date IS NOT DISTINCT FROM OLD.end_date THEN
        RETURN NEW;
    END IF;

    IF EXISTS (
        SELECT 1 FROM schedules
         WHERE trip_id = NEW.id
           AND (date < NEW.start_date OR date > NEW.end_date)
    ) OR EXISTS (
        SELECT 1 FROM checklists
         WHERE trip_id = NEW.id
           AND scheduled_date IS NOT NULL
           AND (scheduled_date < NEW.start_date OR scheduled_date > NEW.end_date)
    ) THEN
        RAISE EXCEPTION 'trip dates must contain schedules and dated checklists'
            USING ERRCODE = '23514', CONSTRAINT = 'trip_contains_dated_items';
    END IF;
    RETURN NEW;
END;
$$;

-- 일부 테이블만 있는 오래된 개발 DB에서도 migration 자체는 재실행 가능해야 한다.
DO $$
BEGIN
    IF to_regclass('trips') IS NOT NULL
       AND to_regclass('schedules') IS NOT NULL
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'trips' AND column_name = 'start_date')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'trips' AND column_name = 'end_date')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = to_regclass('schedules') AND tgname = 'schedules_trip_date_guard' AND NOT tgisinternal) THEN
        CREATE TRIGGER schedules_trip_date_guard
            BEFORE INSERT OR UPDATE OF trip_id, date ON schedules
            FOR EACH ROW EXECUTE FUNCTION validate_schedule_trip_date();
    END IF;

    IF to_regclass('trips') IS NOT NULL
       AND to_regclass('checklists') IS NOT NULL
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'trips' AND column_name = 'start_date')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'checklists' AND column_name = 'scheduled_date')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = to_regclass('checklists') AND tgname = 'checklists_trip_date_guard' AND NOT tgisinternal) THEN
        CREATE TRIGGER checklists_trip_date_guard
            BEFORE INSERT OR UPDATE OF trip_id, scheduled_date ON checklists
            FOR EACH ROW EXECUTE FUNCTION validate_checklist_trip_date();
    END IF;

    IF to_regclass('trips') IS NOT NULL
       AND to_regclass('schedules') IS NOT NULL
       AND to_regclass('checklists') IS NOT NULL
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'trips' AND column_name = 'start_date')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'trips' AND column_name = 'end_date')
       AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = to_regclass('trips') AND tgname = 'trips_dated_items_guard' AND NOT tgisinternal) THEN
        CREATE TRIGGER trips_dated_items_guard
            BEFORE UPDATE OF start_date, end_date ON trips
            FOR EACH ROW EXECUTE FUNCTION validate_trip_date_change();
    END IF;
END;
$$;
