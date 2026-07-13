import { CalendarDays, Link2, ListChecks, MapPin } from "lucide-react";

type ManageFlowGuideProps = {
  hasSelectedTrip: boolean;
  tripCount: number;
};

// 로그인 후 사용자가 무엇부터 해야 하는지 보여주는 관리 홈 안내 카드다.
// 실제 데이터 수정은 아래 목록/상세 섹션이 담당하고, 이 컴포넌트는 흐름 설명만 담당한다.
export function ManageFlowGuide({ hasSelectedTrip, tripCount }: ManageFlowGuideProps) {
  return (
    <article className="manage-flow-card">
      <div>
        <span className="pill">{hasSelectedTrip ? "편집 중" : "시작하기"}</span>
        <h2>{hasSelectedTrip ? "선택한 여행을 아래 순서로 다듬으세요" : "여행을 선택하거나 새로 만드세요"}</h2>
        <p className="muted">
          {tripCount > 0
            ? "목록에서 여행을 고른 뒤 기본 정보, 장소, 항공편, 일정을 차례로 입력하면 공유 링크를 만들 수 있습니다."
            : "첫 여행을 만든 뒤 장소와 항공편, 일정을 입력하면 가족에게 읽기 전용 링크를 공유할 수 있습니다."}
        </p>
      </div>

      <ol className="manage-flow-steps" aria-label="여행 관리 순서">
        <li>
          <MapPin size={18} />
          <span>여행 선택</span>
        </li>
        <li>
          <ListChecks size={18} />
          <span>정보 입력</span>
        </li>
        <li>
          <CalendarDays size={18} />
          <span>일정 정리</span>
        </li>
        <li>
          <Link2 size={18} />
          <span>공유 링크</span>
        </li>
      </ol>
    </article>
  );
}
