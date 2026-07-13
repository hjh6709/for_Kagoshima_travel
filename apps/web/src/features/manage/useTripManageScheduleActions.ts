import type { Dispatch, FormEvent, SetStateAction } from "react";
import { ApiError, type AuthResponse } from "../../api/auth";
import {
  createTripSchedule,
  deleteTripSchedule,
  type OwnerTrip,
  type SharedSchedule,
} from "../../api/trips";
import { sortSharedSchedules } from "../../shared/sort";
import type { ScheduleItem } from "../../types/travel";

type ScheduleFormState = {
  newScheduleDate: string;
  newScheduleGuideMemo: string;
  newSchedulePlaceID: string;
  newScheduleTime: string;
  newScheduleTitle: string;
  newScheduleTransportMemo: string;
  newScheduleType: ScheduleItem["type"];
  setDeletingScheduleID: Dispatch<SetStateAction<string>>;
  setNewScheduleGuideMemo: Dispatch<SetStateAction<string>>;
  setNewSchedulePlaceID: Dispatch<SetStateAction<string>>;
  setNewScheduleTime: Dispatch<SetStateAction<string>>;
  setNewScheduleTitle: Dispatch<SetStateAction<string>>;
  setNewScheduleTransportMemo: Dispatch<SetStateAction<string>>;
  setScheduleCreateError: Dispatch<SetStateAction<string>>;
  setScheduleCreateSubmitting: Dispatch<SetStateAction<boolean>>;
  setScheduleDeleteError: Dispatch<SetStateAction<string>>;
};

type UseTripManageScheduleActionsParams = {
  clearOwnerSession: () => void;
  ownerAuth: AuthResponse | null;
  ownerSchedules: SharedSchedule[];
  scheduleForm: ScheduleFormState;
  selectedOwnerTrip: OwnerTrip | null;
  setOwnerSchedules: Dispatch<SetStateAction<SharedSchedule[]>>;
};

// 선택 여행의 일정 생성/삭제 액션만 담당한다.
export function useTripManageScheduleActions({
  clearOwnerSession,
  ownerAuth,
  ownerSchedules,
  scheduleForm,
  selectedOwnerTrip,
  setOwnerSchedules,
}: UseTripManageScheduleActionsParams) {
  // 일정 추가 폼 입력값을 검증한 뒤 서버에 저장하고, 성공하면 화면 목록에 즉시 반영한다.
  async function submitNewSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ownerAuth || !selectedOwnerTrip) return;

    const date = scheduleForm.newScheduleDate;
    const time = scheduleForm.newScheduleTime.trim();
    const title = scheduleForm.newScheduleTitle.trim();
    const transportMemo = scheduleForm.newScheduleTransportMemo.trim();
    const guideMemo = scheduleForm.newScheduleGuideMemo.trim();

    if (!date || !time || !title) {
      scheduleForm.setScheduleCreateError("날짜, 시간, 제목을 입력해주세요.");
      return;
    }
    if (date < selectedOwnerTrip.startDate || date > selectedOwnerTrip.endDate) {
      scheduleForm.setScheduleCreateError("일정 날짜는 여행 기간 안에서 선택해주세요.");
      return;
    }

    scheduleForm.setScheduleCreateError("");
    scheduleForm.setScheduleCreateSubmitting(true);
    try {
      const createdSchedule = await createTripSchedule(ownerAuth.accessToken, selectedOwnerTrip.id, {
        date,
        time,
        type: scheduleForm.newScheduleType,
        title,
        placeId: scheduleForm.newSchedulePlaceID || undefined,
        transportMemo: transportMemo || undefined,
        guideMemo: guideMemo || undefined,
      });
      setOwnerSchedules((currentSchedules) => sortSharedSchedules([...currentSchedules, createdSchedule]));
      scheduleForm.setNewScheduleTime("");
      scheduleForm.setNewScheduleTitle("");
      scheduleForm.setNewSchedulePlaceID("");
      scheduleForm.setNewScheduleTransportMemo("");
      scheduleForm.setNewScheduleGuideMemo("");
      scheduleForm.setScheduleCreateError("");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearOwnerSession();
        scheduleForm.setScheduleCreateError("");
        return;
      }
      scheduleForm.setScheduleCreateError(error instanceof Error ? error.message : "일정을 추가하지 못했습니다.");
    } finally {
      scheduleForm.setScheduleCreateSubmitting(false);
    }
  }

  // 일정 목록의 편집 모드에서 사용자가 선택한 일정을 삭제한다.
  async function deleteOwnerSchedule(scheduleID: string) {
    if (!ownerAuth || !selectedOwnerTrip) return;

    const schedule = ownerSchedules.find((item) => item.id === scheduleID);
    const confirmed = window.confirm(schedule ? `"${schedule.title}" 일정을 삭제할까요?` : "일정을 삭제할까요?");
    if (!confirmed) return;

    scheduleForm.setScheduleDeleteError("");
    scheduleForm.setDeletingScheduleID(scheduleID);
    try {
      await deleteTripSchedule(ownerAuth.accessToken, selectedOwnerTrip.id, scheduleID);
      setOwnerSchedules((currentSchedules) => currentSchedules.filter((item) => item.id !== scheduleID));
      scheduleForm.setScheduleDeleteError("");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearOwnerSession();
        scheduleForm.setScheduleDeleteError("");
        return;
      }
      scheduleForm.setScheduleDeleteError(error instanceof Error ? error.message : "일정을 삭제하지 못했습니다.");
    } finally {
      scheduleForm.setDeletingScheduleID("");
    }
  }

  return {
    deleteOwnerSchedule,
    submitNewSchedule,
  };
}
