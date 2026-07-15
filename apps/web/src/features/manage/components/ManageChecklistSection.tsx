import { Trash2 } from "lucide-react";
import type { ChecklistItemResponse } from "../../../api/checklist";
import { checklistCategories } from "../../../shared/travelOptions";

// ManageChecklistSectionProps는 체크리스트 관리 컴포넌트가 부모로부터 주입받는 속성 규격입니다.
type ManageChecklistSectionProps = {
	checklistItems: ChecklistItemResponse[];                                            // 준비물 리스트
	checklistLoading: boolean;                                                           // 준비물 데이터 로딩 상태
	checklistError: string;                                                              // 발생 에러 메시지
	newChecklistTitle: string;                                                           // 추가할 신규 준비물 타이틀 인풋값
	setNewChecklistTitle: (val: string) => void;                                         // 신규 타이틀 세터
	newChecklistCategory: "before" | "airport" | "daily" | "return";                     // 추가할 신규 준비물 카테고리값
	setNewChecklistCategory: (val: "before" | "airport" | "daily" | "return") => void;   // 신규 카테고리 세터
	checklistSubmitting: boolean;                                                        // 저장 전송 중(pending) 유무
	handleAddChecklistItem: (e: React.FormEvent) => void;                                // 등록 이벤트 핸들러
	handleToggleChecklistItem: (itemID: string, isCompleted: boolean) => void;           // 체크박스 토글 이벤트 핸들러
	handleDeleteChecklistItem: (itemID: string) => void;                                 // 항목 삭제 이벤트 핸들러
};

// ManageChecklistSection 컴포넌트는 여행 소유자용 체크리스트 관리 카드 UI입니다.
// 일본/중국 등의 목적지에 최적화되어 자동 생성된 프리셋 준비물과 사용자의 커스텀 준비물을 통합 관리합니다.
export function ManageChecklistSection({
	checklistItems,
	checklistLoading,
	checklistError,
	newChecklistTitle,
	setNewChecklistTitle,
	newChecklistCategory,
	setNewChecklistCategory,
	checklistSubmitting,
	handleAddChecklistItem,
	handleToggleChecklistItem,
	handleDeleteChecklistItem,
}: ManageChecklistSectionProps) {
	// 사용자가 한눈에 보기 편하도록 준비물 항목들을 카테고리별(출발 전, 공항에서 등)로 그룹핑합니다.
	const groupedItems = checklistCategories.map(([category, label]) => {
		return {
			category,
			label,
			items: checklistItems.filter((item) => item.category === category),
		};
	}).filter((group) => group.items.length > 0); // 등록된 준비물이 존재하는 카테고리만 화면에 렌더링

	const completedCount = checklistItems.filter((item) => item.isCompleted).length;

	return (
		<section className="section-block manage-checklist-section">
			{/* 헤더 타이틀 및 준비 진척도(완료율) 노출 */}
			<div className="section-title-row">
				<div>
					<h2>준비물 체크리스트</h2>
					<p className="section-caption">
						여행 국가별 필수 준비물이 자동으로 주입되었습니다. 체크박스를 눌러 준비 상태를 관리하세요.
					</p>
				</div>
				<span className="pill subtle">
					{checklistItems.length}개 중 {completedCount}개 완료
				</span>
			</div>

			{checklistError && <p className="form-error">{checklistError}</p>}

			{/* 데이터 렌더링 본문 */}
			{checklistLoading ? (
				<p className="muted text-center">준비물을 불러오는 중...</p>
			) : checklistItems.length === 0 ? (
				<article className="empty-state-card list-card">
					<p className="muted">등록된 준비물 항목이 없습니다.</p>
				</article>
			) : (
				<div className="checklist-group-stack">
					{groupedItems.map((group) => (
						<div className="checklist-group-card" key={group.category}>
							<h3>{group.label}</h3>
							<div className="checklist-item-list">
								{group.items.map((item) => (
									<div
										className={`checklist-item-row ${item.isCompleted ? "completed" : ""}`}
										key={item.id}
									>
										{/* 체크 완료/미완료 토글 제어 영역 */}
										<label className="checkbox-container">
											<input
												checked={item.isCompleted}
												onChange={(e) => handleToggleChecklistItem(item.id, e.target.checked)}
												type="checkbox"
											/>
											<span className="checkmark"></span>
											<span className="item-title">{item.title}</span>
										</label>
										{/* 개별 항목 삭제 버튼 */}
										<button
											className="delete-item-button"
											onClick={() => handleDeleteChecklistItem(item.id)}
											title="준비물 삭제"
											type="button"
										>
											<Trash2 size={16} />
										</button>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			)}

			{/* 커스텀 준비물 수동 입력 추가 폼 */}
			<form className="check-add-form inline-add-form" onSubmit={handleAddChecklistItem}>
				<div className="input-group row-group">
					<select
						value={newChecklistCategory}
						onChange={(e) => setNewChecklistCategory(e.target.value as any)}
					>
						{checklistCategories.map(([category, label]) => (
							<option key={category} value={category}>
								{label}
							</option>
						))}
					</select>
					<input
						placeholder="새 준비물 입력..."
						type="text"
						value={newChecklistTitle}
						onChange={(e) => setNewChecklistTitle(e.target.value)}
					/>
					<button className="primary-button" disabled={checklistSubmitting || !newChecklistTitle.trim()} type="submit">
						{checklistSubmitting ? "추가 중" : "추가"}
					</button>
				</div>
			</form>
		</section>
	);
}
