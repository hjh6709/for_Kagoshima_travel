import { CalendarPlus, Check, Link2Off, MapPin } from "lucide-react";
import type { SharedPlace, SharedSchedule } from "../../../api/trips";
import { formatKoreanDate } from "../../../shared/date";
import { getScheduleTypeLabel } from "../../../shared/travelOptions";
import type { ScheduleItem } from "../../../types/travel";

type ShanghaiPlanItem = {
  dayOffset: number;
  time: string;
  type: ScheduleItem["type"];
  title: string;
  placeAliases: string[];
  transportMemo: string;
  guideMemo: string;
};

type ShanghaiStarterPlannerProps = {
  tripStartDate: string;
  tripEndDate: string;
  ownerPlaces: SharedPlace[];
  ownerSchedules: SharedSchedule[];
  onApply: (item: ShanghaiPlanItem & { date: string; placeID: string }) => void;
};

const SHANGHAI_STARTER_PLAN: ShanghaiPlanItem[] = [
  {
    dayOffset: 0,
    time: "18:00",
    type: "shopping",
    title: "난징동루에서 상하이 첫 저녁",
    placeAliases: ["난징동루", "南京东路"],
    transportMemo: "2·10호선 난징동루역에서 시작해 보행자 거리를 천천히 걷기",
    guideMemo: "항공편 도착이 늦으면 다음 날로 옮기고, 소지품과 호객 행위를 주의하세요.",
  },
  {
    dayOffset: 0,
    time: "20:00",
    type: "sightseeing",
    title: "와이탄 야경 산책",
    placeAliases: ["와이탄", "外滩"],
    transportMemo: "난징동루에서 와이탄까지 도보 이동, 귀가 택시 승차 지점 미리 확인",
    guideMemo: "해가 진 뒤 조명이 켜지는 시간을 확인하고 강변에서는 휴대폰을 단단히 잡으세요.",
  },
  {
    dayOffset: 1,
    time: "10:00",
    type: "sightseeing",
    title: "예원 정원과 올드타운",
    placeAliases: ["예원", "豫园"],
    transportMemo: "10·14호선 예원역 3번 출구에서 도보 이동",
    guideMemo: "오전 일찍 방문해 혼잡을 피하고 정원 입장권 운영 여부를 전날 확인하세요.",
  },
  {
    dayOffset: 1,
    time: "15:00",
    type: "sightseeing",
    title: "신천지 산책과 카페 휴식",
    placeAliases: ["신천지", "新天地"],
    transportMemo: "예원에서 지하철 10호선으로 신천지역 이동",
    guideMemo: "저녁 식사 후보를 함께 확인하고 무더운 시간에는 카페에서 충분히 쉬세요.",
  },
  {
    dayOffset: 2,
    time: "10:00",
    type: "sightseeing",
    title: "상하이 타워 전망대",
    placeAliases: ["상하이타워", "上海中心大厦"],
    transportMemo: "2호선 루자쭈이역 6번 출구에서 도보 이동",
    guideMemo: "전망대 예매 시간과 기상 상태를 확인하고 여권을 지참하세요.",
  },
  {
    dayOffset: 2,
    time: "15:00",
    type: "sightseeing",
    title: "동방명주와 루자쭈이 산책",
    placeAliases: ["동방명주", "东方明珠"],
    transportMemo: "상하이 타워에서 루자쭈이 보행 데크를 따라 이동",
    guideMemo: "전망대는 한 곳만 입장하고 나머지 시간은 강변과 보행 데크에 배분해도 충분합니다.",
  },
  {
    dayOffset: 3,
    time: "10:00",
    type: "sightseeing",
    title: "상하이 박물관 관람",
    placeAliases: ["상하이박물관", "上海博物馆"],
    transportMemo: "1·2·8호선 인민광장역 1번 출구에서 도보 이동",
    guideMemo: "사전 예약 필요 여부와 휴관일을 확인하고 큰 짐은 숙소에 보관하세요.",
  },
  {
    dayOffset: 3,
    time: "15:00",
    type: "move",
    title: "푸동공항 이동",
    placeAliases: ["푸동국제공항", "浦东国际机场", "푸동공항"],
    transportMemo: "항공편 출발 3시간 전 공항 도착을 기준으로 숙소 출발 시간 역산",
    guideMemo: "터미널과 체크인 카운터를 확인하고 알리페이 교통 결제 수단을 마지막까지 유지하세요.",
  },
];

function addDays(date: string, offset: number) {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(year, month - 1, day + offset);
  const nextYear = value.getFullYear();
  const nextMonth = String(value.getMonth() + 1).padStart(2, "0");
  const nextDay = String(value.getDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function normalizePlaceName(value: string) {
  return value.toLocaleLowerCase().replace(/[\s()（）·]/g, "");
}

function findMatchingPlace(places: SharedPlace[], aliases: string[]) {
  return places.find((place) => {
    const searchableName = normalizePlaceName(`${place.name} ${place.chineseName ?? ""}`);
    return aliases.some((alias) => searchableName.includes(normalizePlaceName(alias)));
  });
}

export function ShanghaiStarterPlanner({
  tripStartDate,
  tripEndDate,
  ownerPlaces,
  ownerSchedules,
  onApply,
}: ShanghaiStarterPlannerProps) {
  const planItems = SHANGHAI_STARTER_PLAN.map((item) => ({ ...item, date: addDays(tripStartDate, item.dayOffset) }))
    .filter((item) => item.date <= tripEndDate);

  return (
    <section className="shanghai-starter-planner" aria-labelledby="shanghai-planner-title">
      <div className="shanghai-planner-heading">
        <div>
          <span className="pill">상하이 추천 플랜</span>
          <h4 id="shanghai-planner-title">여행 날짜에 맞춘 상하이 시작 일정</h4>
          <p className="section-caption">
            원하는 항목을 일정 폼에 담아 확인한 뒤 저장하세요. 항공편과 숙소 위치에 맞게 시간은 조정할 수 있습니다.
          </p>
        </div>
        <CalendarPlus aria-hidden="true" size={22} />
      </div>

      <div className="shanghai-plan-list">
        {planItems.map((item) => {
          const matchingPlace = findMatchingPlace(ownerPlaces, item.placeAliases);
          const isAdded = ownerSchedules.some((schedule) => schedule.title === item.title);

          return (
            <article className="shanghai-plan-item" key={`${item.date}-${item.time}-${item.title}`}>
              <div className="shanghai-plan-time">
                <strong>{formatKoreanDate(item.date)}</strong>
                <span>{item.time}</span>
              </div>
              <div className="shanghai-plan-copy">
                <span className="muted-label">{getScheduleTypeLabel(item.type)}</span>
                <h5>{item.title}</h5>
                <span className={matchingPlace ? "planner-place-status connected" : "planner-place-status"}>
                  {matchingPlace ? <MapPin aria-hidden="true" size={13} /> : <Link2Off aria-hidden="true" size={13} />}
                  {matchingPlace ? `${matchingPlace.name} 자동 연결` : "저장된 장소 없음 · 일정만 먼저 추가 가능"}
                </span>
              </div>
              <button
                className={isAdded ? "secondary-button compact-button" : "primary-button compact-button"}
                disabled={isAdded}
                onClick={() =>
                  onApply({
                    ...item,
                    placeID: matchingPlace?.id ?? "",
                  })
                }
                type="button"
              >
                {isAdded ? <Check aria-hidden="true" size={15} /> : <CalendarPlus aria-hidden="true" size={15} />}
                {isAdded ? "추가됨" : "폼에 담기"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
