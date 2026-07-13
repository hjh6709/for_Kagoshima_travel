import { useState } from "react";
import type { SharedSchedule } from "../../api/trips";
import type { ScheduleItem } from "../../types/travel";

// 일정 추가 폼과 일정 목록 편집 상태를 모아 관리한다.
export function useScheduleManageFormState() {
  const [newScheduleDate, setNewScheduleDate] = useState("");
  const [newScheduleTime, setNewScheduleTime] = useState("");
  const [newScheduleType, setNewScheduleType] = useState<ScheduleItem["type"]>("sightseeing");
  const [newScheduleTitle, setNewScheduleTitle] = useState("");
  const [newSchedulePlaceID, setNewSchedulePlaceID] = useState("");
  const [newScheduleTransportMemo, setNewScheduleTransportMemo] = useState("");
  const [newScheduleGuideMemo, setNewScheduleGuideMemo] = useState("");
  const [scheduleCreateError, setScheduleCreateError] = useState("");
  const [scheduleCreateSubmitting, setScheduleCreateSubmitting] = useState(false);
  const [isScheduleListEditing, setIsScheduleListEditing] = useState(false);
  const [scheduleDeleteError, setScheduleDeleteError] = useState("");
  const [deletingScheduleID, setDeletingScheduleID] = useState("");
  const [editingScheduleID, setEditingScheduleID] = useState("");
  const [editingScheduleDate, setEditingScheduleDate] = useState("");
  const [editingScheduleTime, setEditingScheduleTime] = useState("");
  const [editingScheduleType, setEditingScheduleType] = useState<ScheduleItem["type"]>("sightseeing");
  const [editingScheduleTitle, setEditingScheduleTitle] = useState("");
  const [editingSchedulePlaceID, setEditingSchedulePlaceID] = useState("");
  const [editingScheduleTransportMemo, setEditingScheduleTransportMemo] = useState("");
  const [editingScheduleGuideMemo, setEditingScheduleGuideMemo] = useState("");
  const [scheduleEditError, setScheduleEditError] = useState("");
  const [scheduleEditSubmitting, setScheduleEditSubmitting] = useState(false);

  // 수정 폼을 닫을 때는 편집 대상과 입력값을 함께 비운다.
  function cancelScheduleEdit() {
    setEditingScheduleID("");
    setEditingScheduleDate("");
    setEditingScheduleTime("");
    setEditingScheduleType("sightseeing");
    setEditingScheduleTitle("");
    setEditingSchedulePlaceID("");
    setEditingScheduleTransportMemo("");
    setEditingScheduleGuideMemo("");
    setScheduleEditError("");
    setScheduleEditSubmitting(false);
  }

  // 목록 카드의 수정 버튼을 누르면 현재 서버 일정 값을 편집 폼 초기값으로 복사한다.
  function startScheduleEdit(schedule: SharedSchedule) {
    setEditingScheduleID(schedule.id);
    setEditingScheduleDate(schedule.date);
    setEditingScheduleTime(schedule.time);
    setEditingScheduleType(schedule.type as ScheduleItem["type"]);
    setEditingScheduleTitle(schedule.title);
    setEditingSchedulePlaceID(schedule.placeId ?? "");
    setEditingScheduleTransportMemo(schedule.transportMemo ?? "");
    setEditingScheduleGuideMemo(schedule.guideMemo ?? "");
    setScheduleEditError("");
  }

  // 선택 여행이 없거나 닫혔을 때는 일정 입력과 편집 모드를 완전히 초기화한다.
  function resetScheduleManageForm() {
    setNewScheduleDate("");
    setNewScheduleTime("");
    setNewScheduleType("sightseeing");
    setNewScheduleTitle("");
    setNewSchedulePlaceID("");
    setNewScheduleTransportMemo("");
    setNewScheduleGuideMemo("");
    setScheduleCreateError("");
    setIsScheduleListEditing(false);
    setScheduleDeleteError("");
    setDeletingScheduleID("");
    cancelScheduleEdit();
  }

  // 새 여행을 선택하면 일정 추가 날짜는 여행 시작일로 맞추고 나머지 입력값은 비운다.
  function prepareScheduleManageForm(startDate: string) {
    setNewScheduleDate(startDate);
    setNewScheduleTime("");
    setNewScheduleType("sightseeing");
    setNewScheduleTitle("");
    setNewSchedulePlaceID("");
    setNewScheduleTransportMemo("");
    setNewScheduleGuideMemo("");
    setScheduleCreateError("");
    setIsScheduleListEditing(false);
    setScheduleDeleteError("");
    setDeletingScheduleID("");
    cancelScheduleEdit();
  }

  return {
    newScheduleDate,
    setNewScheduleDate,
    newScheduleTime,
    setNewScheduleTime,
    newScheduleType,
    setNewScheduleType,
    newScheduleTitle,
    setNewScheduleTitle,
    newSchedulePlaceID,
    setNewSchedulePlaceID,
    newScheduleTransportMemo,
    setNewScheduleTransportMemo,
    newScheduleGuideMemo,
    setNewScheduleGuideMemo,
    scheduleCreateError,
    setScheduleCreateError,
    scheduleCreateSubmitting,
    setScheduleCreateSubmitting,
    isScheduleListEditing,
    setIsScheduleListEditing,
    scheduleDeleteError,
    setScheduleDeleteError,
    deletingScheduleID,
    setDeletingScheduleID,
    editingScheduleID,
    editingScheduleDate,
    setEditingScheduleDate,
    editingScheduleTime,
    setEditingScheduleTime,
    editingScheduleType,
    setEditingScheduleType,
    editingScheduleTitle,
    setEditingScheduleTitle,
    editingSchedulePlaceID,
    setEditingSchedulePlaceID,
    editingScheduleTransportMemo,
    setEditingScheduleTransportMemo,
    editingScheduleGuideMemo,
    setEditingScheduleGuideMemo,
    scheduleEditError,
    setScheduleEditError,
    scheduleEditSubmitting,
    setScheduleEditSubmitting,
    cancelScheduleEdit,
    startScheduleEdit,
    resetScheduleManageForm,
    prepareScheduleManageForm,
  };
}
