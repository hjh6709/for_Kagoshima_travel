import { MapDirectionsChoice } from "../../../../shared/components/MapDirectionsChoice";
import { formatKoreanDate } from "../../../../shared/date";
import type { Place, ScheduleItem } from "../../../../types/travel";
import { Sparkles, Clock } from "lucide-react";

type NextScheduleCardProps = {
  destinationCountry?: string;
  getDisplayDate: (dateStr: string) => string;
  getPlace: (placeId?: string) => Place | undefined;
  nextSchedule: ScheduleItem;
};

// 홈 화면의 다음 일정 카드만 담당한다.
export function NextScheduleCard({ destinationCountry, getDisplayDate, getPlace, nextSchedule }: NextScheduleCardProps) {
  const place = getPlace(nextSchedule.placeId);

  return (
    <article className="hero-card">
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <span className="pill" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#34d399", boxShadow: "0 0 8px #34d399" }} />
            <Sparkles size={12} />
            다음 일정
          </span>
        </div>
        <h2>{nextSchedule.title}</h2>
        <p style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Clock size={14} style={{ opacity: 0.8 }} />
          {formatKoreanDate(getDisplayDate(nextSchedule.date))} {nextSchedule.time}
        </p>
        <p className="muted">{nextSchedule.guideMemo}</p>
      </div>
      {place && <MapDirectionsChoice destinationCountry={destinationCountry} place={place} />}
    </article>
  );
}
