type ScheduleSummarySectionProps = {
  completedCount: number;
  totalCount: number;
};

// 선택한 날짜의 일정 진행 상황만 보여준다.
export function ScheduleSummarySection({ completedCount, totalCount }: ScheduleSummarySectionProps) {
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="schedule-summary">
      <p className="schedule-summary-count">
        {totalCount}개 중 {completedCount}개 완료
      </p>
      <div
        aria-label="선택한 날짜의 일정 완료율"
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={percentage}
        className="schedule-summary-track"
        role="progressbar"
      >
        <div className="schedule-summary-fill" style={{ transform: `scaleX(${percentage / 100})` }} />
      </div>
    </div>
  );
}
