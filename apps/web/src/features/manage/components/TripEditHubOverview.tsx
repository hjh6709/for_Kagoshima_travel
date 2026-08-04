import {
  CalendarDays,
  Check,
  ChevronRight,
  Compass,
  Link2,
  ListChecks,
  Luggage,
  MapPin,
  Plane,
} from "lucide-react";
import { getManageTripEditSectionPath, getManageTripPath, type EditSection } from "../../../shared/manageRoute";

type TripEditHubOverviewProps = {
  checklistCount: number;
  flightCount: number;
  placeCount: number;
  scheduleCount: number;
  tripId: string;
};

type NextStep = {
  actionLabel: string;
  description: string;
  href: string;
  icon: typeof Compass;
  secondaryHref: string;
  secondaryLabel: string;
  title: string;
};

type EditCategory = {
  description: string;
  icon: typeof Luggage;
  label: string;
  section: EditSection;
  status: string;
};

export function getTripEditNextStep(
  tripId: string,
  placeCount: number,
  scheduleCount: number,
): NextStep {
  if (placeCount === 0) {
    return {
      actionLabel: "첫 장소 추가",
      description: "숙소, 식당이나 가고 싶은 곳을 검색해 저장하면 지도 핀과 일정 연결에 사용할 수 있습니다.",
      href: getManageTripEditSectionPath(tripId, "places"),
      icon: MapPin,
      secondaryHref: getManageTripEditSectionPath(tripId, "schedules"),
      secondaryLabel: "일정을 먼저 만들기",
      title: "먼저 여행 장소를 저장하세요",
    };
  }

  if (scheduleCount === 0) {
    return {
      actionLabel: "첫 일정 추가",
      description: "저장한 장소에 날짜와 시간을 연결하면 일정 탭과 지도에서 실제 여행 동선을 확인할 수 있습니다.",
      href: getManageTripEditSectionPath(tripId, "schedules"),
      icon: CalendarDays,
      secondaryHref: getManageTripEditSectionPath(tripId, "places"),
      secondaryLabel: "장소 더 추가",
      title: "이제 첫 일정을 연결하세요",
    };
  }

  return {
    actionLabel: "여행 화면 보기",
    description: "저장한 일정과 장소가 오늘·일정·지도 화면에서 어떻게 이어지는지 확인해 보세요.",
    href: getManageTripPath(tripId),
    icon: Compass,
    secondaryHref: getManageTripEditSectionPath(tripId, "schedules"),
    secondaryLabel: "일정 계속 편집",
    title: "여행 동선을 확인할 준비가 됐어요",
  };
}

export function TripEditHubOverview({
  checklistCount,
  flightCount,
  placeCount,
  scheduleCount,
  tripId,
}: TripEditHubOverviewProps) {
  const nextStep = getTripEditNextStep(tripId, placeCount, scheduleCount);
  const NextStepIcon = nextStep.icon;
  const categories: EditCategory[] = [
    { description: "여행명, 기간과 목적지", icon: Luggage, label: "기본정보", section: "basic", status: "설정됨" },
    { description: "지도 핀과 길찾기 기준", icon: MapPin, label: "장소", section: "places", status: `${placeCount}곳` },
    { description: "출발·도착 시간", icon: Plane, label: "항공편", section: "flights", status: `${flightCount}편` },
    { description: "날짜별 시간과 장소", icon: CalendarDays, label: "일정", section: "schedules", status: `${scheduleCount}개` },
    { description: "전체·날짜별 준비물", icon: ListChecks, label: "체크리스트", section: "checklist", status: `${checklistCount}개` },
    { description: "읽기 전용 여행 공유", icon: Link2, label: "공유 링크", section: "share", status: "선택" },
  ];

  return (
    <>
      <section className="edit-hub-next-step" aria-labelledby="edit-hub-next-title">
        <span className="edit-hub-next-icon" aria-hidden="true">
          <NextStepIcon size={22} />
        </span>
        <div className="edit-hub-next-copy">
          <span className="edit-hub-kicker">추천하는 다음 단계</span>
          <h2 id="edit-hub-next-title">{nextStep.title}</h2>
          <p>{nextStep.description}</p>
        </div>
        <div className="edit-hub-next-actions">
          <a className="primary-button" href={nextStep.href}>{nextStep.actionLabel}</a>
          <a className="secondary-button" href={nextStep.secondaryHref}>{nextStep.secondaryLabel}</a>
        </div>
      </section>

      <section className="edit-hub-all-sections" aria-labelledby="edit-hub-sections-title">
        <div>
          <h2 id="edit-hub-sections-title">전체 편집</h2>
          <p>필요한 항목만 골라 수정할 수 있습니다.</p>
        </div>
        <ul className="edit-hub-list">
          {categories.map(({ description, icon: Icon, label, section, status }) => (
            <li key={section}>
              <a href={getManageTripEditSectionPath(tripId, section)}>
                <span className="edit-hub-list-icon" aria-hidden="true"><Icon size={20} /></span>
                <span className="edit-hub-list-copy">
                  <strong>{label}</strong>
                  <small>{description}</small>
                </span>
                <span className="edit-hub-list-status">
                  {status === "설정됨" && <Check aria-hidden="true" size={15} />}
                  {status}
                </span>
                <ChevronRight aria-hidden="true" className="edit-hub-list-chevron" size={18} />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
