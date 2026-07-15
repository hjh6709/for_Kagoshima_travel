import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { AuthResponse } from "../../api/auth";
import {
  createTripSchedule,
  deleteTripSchedule,
  updateTripSchedule,
  type OwnerTrip,
  type SharedSchedule,
} from "../../api/trips";
import { sortSharedSchedules } from "../../shared/sort";
import type { ScheduleItem } from "../../types/travel";
import { handleManageApiError, isDateOutsideTrip, optionalTrimmedText } from "./manageFormUtils";
import { isOnline } from "../../utils/offlineCache";

type ScheduleFormState = {
  newScheduleDate: string;
  newScheduleGuideMemo: string;
  newSchedulePlaceID: string;
  newScheduleTime: string;
  newScheduleTitle: string;
  newScheduleTransportMemo: string;
  newScheduleType: ScheduleItem["type"];
  cancelScheduleEdit: () => void;
  setDeletingScheduleID: Dispatch<SetStateAction<string>>;
  editingScheduleDate: string;
  editingScheduleGuideMemo: string;
  editingScheduleID: string;
  editingSchedulePlaceID: string;
  editingScheduleTime: string;
  editingScheduleTitle: string;
  editingScheduleTransportMemo: string;
  editingScheduleType: ScheduleItem["type"];
  setScheduleEditError: Dispatch<SetStateAction<string>>;
  setScheduleEditSubmitting: Dispatch<SetStateAction<boolean>>;
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

    // [시니어 코드리뷰 반영]: 오프라인 환경 쓰기 동작 방어 가드
    // 오프라인 상태일 때는 일정 생성 API 전송을 사전에 차단하여 에러 및 데이터 손실 상태를 방지합니다.
    if (!isOnline()) {
      scheduleForm.setScheduleCreateError("네트워크 연결이 끊겼습니다. 오프라인 상태에서는 일정을 추가할 수 없습니다.");
      return;
    }

    const date = scheduleForm.newScheduleDate;
    const time = scheduleForm.newScheduleTime.trim();
    const title = scheduleForm.newScheduleTitle.trim();
    const transportMemo = optionalTrimmedText(scheduleForm.newScheduleTransportMemo);
    const guideMemo = optionalTrimmedText(scheduleForm.newScheduleGuideMemo);

    if (!date || !time || !title) {
      scheduleForm.setScheduleCreateError("날짜, 시간, 제목을 입력해주세요.");
      return;
    }
    if (isDateOutsideTrip(date, selectedOwnerTrip)) {
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
        transportMemo,
        guideMemo,
      });
      setOwnerSchedules((currentSchedules) => sortSharedSchedules([...currentSchedules, createdSchedule]));
      scheduleForm.setNewScheduleTime("");
      scheduleForm.setNewScheduleTitle("");
      scheduleForm.setNewSchedulePlaceID("");
      scheduleForm.setNewScheduleTransportMemo("");
      scheduleForm.setNewScheduleGuideMemo("");
      scheduleForm.setScheduleCreateError("");
    } catch (error) {
      handleManageApiError(error, {
        clearOwnerSession,
        fallbackMessage: "일정을 추가하지 못했습니다.",
        setError: scheduleForm.setScheduleCreateError,
      });
    } finally {
      scheduleForm.setScheduleCreateSubmitting(false);
    }
  }

  // 일정 수정 폼 입력값을 검증한 뒤 서버에 반영하고, 성공하면 목록의 해당 일정만 교체한다.
  async function submitScheduleEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ownerAuth || !selectedOwnerTrip || !scheduleForm.editingScheduleID) return;

    // [시니어 코드리뷰 반영]: 오프라인 환경 쓰기 동작 방어 가드
    // 오프라인 상태일 때는 일정 수정 API 요청을 사전에 차단하여 로컬-서버 상태 불일치를 방지합니다.
    if (!isOnline()) {
      scheduleForm.setScheduleEditError("네트워크 연결이 끊겼습니다. 오프라인 상태에서는 일정을 수정할 수 없습니다.");
      return;
    }

    const date = scheduleForm.editingScheduleDate;
    const time = scheduleForm.editingScheduleTime.trim();
    const title = scheduleForm.editingScheduleTitle.trim();
    const transportMemo = scheduleForm.editingScheduleTransportMemo.trim();
    const guideMemo = scheduleForm.editingScheduleGuideMemo.trim();

    if (!date || !time || !title) {
      scheduleForm.setScheduleEditError("날짜, 시간, 제목을 입력해주세요.");
      return;
    }
    if (isDateOutsideTrip(date, selectedOwnerTrip)) {
      scheduleForm.setScheduleEditError("일정 날짜는 여행 기간 안에서 선택해주세요.");
      return;
    }

    scheduleForm.setScheduleEditError("");
    scheduleForm.setScheduleEditSubmitting(true);
    try {
      const updatedSchedule = await updateTripSchedule(
        ownerAuth.accessToken,
        selectedOwnerTrip.id,
        scheduleForm.editingScheduleID,
        {
          date,
          time,
          type: scheduleForm.editingScheduleType,
          title,
          placeId: scheduleForm.editingSchedulePlaceID,
          transportMemo,
          guideMemo,
        }
      );
      setOwnerSchedules((currentSchedules) =>
        sortSharedSchedules(currentSchedules.map((item) => (item.id === updatedSchedule.id ? updatedSchedule : item)))
      );
      scheduleForm.cancelScheduleEdit();
    } catch (error) {
      handleManageApiError(error, {
        clearOwnerSession,
        fallbackMessage: "일정을 수정하지 못했습니다.",
        setError: scheduleForm.setScheduleEditError,
      });
    } finally {
      scheduleForm.setScheduleEditSubmitting(false);
    }
  }

  // 일정 목록의 편집 모드에서 사용자가 선택한 일정을 삭제한다.
  async function deleteOwnerSchedule(scheduleID: string) {
    if (!ownerAuth || !selectedOwnerTrip) return;

    // [시니어 코드리뷰 반영]: 오프라인 환경 쓰기 동작 방어 가드
    // 오프라인 상태일 때는 일정 삭제 API 요청을 전송하지 않도록 사전에 방어합니다.
    if (!isOnline()) {
      scheduleForm.setScheduleDeleteError("네트워크 연결이 끊겼습니다. 오프라인 상태에서는 일정을 삭제할 수 없습니다.");
      return;
    }

    const schedule = ownerSchedules.find((item) => item.id === scheduleID);
    const confirmed = window.confirm(schedule ? `"${schedule.title}" 일정을 삭제할까요?` : "일정을 삭제할까요?");
    if (!confirmed) return;

    scheduleForm.setScheduleDeleteError("");
    scheduleForm.setDeletingScheduleID(scheduleID);
    try {
      await deleteTripSchedule(ownerAuth.accessToken, selectedOwnerTrip.id, scheduleID);
      setOwnerSchedules((currentSchedules) => currentSchedules.filter((item) => item.id !== scheduleID));
      if (scheduleForm.editingScheduleID === scheduleID) {
        scheduleForm.cancelScheduleEdit();
      }
      scheduleForm.setScheduleDeleteError("");
    } catch (error) {
      handleManageApiError(error, {
        clearOwnerSession,
        fallbackMessage: "일정을 삭제하지 못했습니다.",
        setError: scheduleForm.setScheduleDeleteError,
      });
    } finally {
      scheduleForm.setDeletingScheduleID("");
    }
  }

  return {
    deleteOwnerSchedule,
    submitNewSchedule,
    submitScheduleEdit,
  };
}
