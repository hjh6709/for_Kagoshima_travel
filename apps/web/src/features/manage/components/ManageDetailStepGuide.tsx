import { CalendarDays, Link2, MapPin, PencilLine, Plane } from "lucide-react";

// 선택한 여행 상세 안에서 입력 순서를 안내한다.
// 각 단계의 실제 폼과 저장 로직은 아래 섹션 컴포넌트들이 담당한다.
export function ManageDetailStepGuide() {
  return (
    <section className="detail-step-guide" aria-label="선택 여행 편집 순서">
      <div>
        <span className="pill subtle">편집 순서</span>
        <h3>기본 정보부터 입력하고 마지막에 공유 링크를 만드세요</h3>
        <p className="section-caption">장소와 항공편을 먼저 저장해두면 일정을 만들 때 연결하기 쉽습니다.</p>
      </div>

      <ol className="detail-step-list">
        <li>
          <PencilLine size={16} />
          <span>기본</span>
        </li>
        <li>
          <MapPin size={16} />
          <span>장소</span>
        </li>
        <li>
          <Plane size={16} />
          <span>항공</span>
        </li>
        <li>
          <CalendarDays size={16} />
          <span>일정</span>
        </li>
        <li>
          <Link2 size={16} />
          <span>공유</span>
        </li>
      </ol>
    </section>
  );
}
