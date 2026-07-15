import { Trash2 } from "lucide-react";
import type { ChecklistItemResponse } from "../../../api/checklist";
import { checklistCategories } from "../../../shared/travelOptions";

type ManageChecklistSectionProps = {
	checklistItems: ChecklistItemResponse[];
	checklistLoading: boolean;
	checklistError: string;
	newChecklistTitle: string;
	setNewChecklistTitle: (val: string) => void;
	newChecklistCategory: "before" | "airport" | "daily" | "return";
	setNewChecklistCategory: (val: "before" | "airport" | "daily" | "return") => void;
	checklistSubmitting: boolean;
	handleAddChecklistItem: (e: React.FormEvent) => void;
	handleToggleChecklistItem: (itemID: string, isCompleted: boolean) => void;
	handleDeleteChecklistItem: (itemID: string) => void;
};

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
	// 카테고리별로 그룹화
	const groupedItems = checklistCategories.map(([category, label]) => {
		return {
			category,
			label,
			items: checklistItems.filter((item) => item.category === category),
		};
	}).filter((group) => group.items.length > 0);

	const completedCount = checklistItems.filter((item) => item.isCompleted).length;

	return (
		<section className="section-block manage-checklist-section">
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
										<label className="checkbox-container">
											<input
												checked={item.isCompleted}
												onChange={(e) => handleToggleChecklistItem(item.id, e.target.checked)}
												type="checkbox"
											/>
											<span className="checkmark"></span>
											<span className="item-title">{item.title}</span>
										</label>
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
