import type { EditSection } from "../../../shared/manageRoute";
import { getTripEditNextStep } from "./TripEditHubOverview";

type TripEditSectionNextStepProps = {
  placeCount: number;
  scheduleCount: number;
  section: EditSection;
  tripId: string;
};

// 편집 항목 화면에서 방금 끝낸 단계의 다음 행동 하나를 이어 준다.
// 허브의 추천 규칙(getTripEditNextStep)을 그대로 쓰고, 이 화면에서 막 첫 항목을 만든 순간에만 보여 준다.
export function TripEditSectionNextStep({ placeCount, scheduleCount, section, tripId }: TripEditSectionNextStepProps) {
  const justSavedFirstPlace = section === "places" && placeCount > 0 && scheduleCount === 0;
  const hasSchedules = section === "schedules" && scheduleCount > 0;
  if (!justSavedFirstPlace && !hasSchedules) return null;

  const nextStep = getTripEditNextStep(tripId, placeCount, scheduleCount);
  const NextStepIcon = nextStep.icon;

  return (
    <section className="edit-hub-next-step edit-section-next-step" aria-labelledby="edit-section-next-title">
      <span className="edit-hub-next-icon" aria-hidden="true">
        <NextStepIcon size={22} />
      </span>
      <div className="edit-hub-next-copy">
        <span className="edit-hub-kicker">다음 단계</span>
        <h2 id="edit-section-next-title">{nextStep.title}</h2>
        <p>{nextStep.description}</p>
      </div>
      <div className="edit-hub-next-actions">
        <a className="primary-button" href={nextStep.href}>{nextStep.actionLabel}</a>
      </div>
    </section>
  );
}
