import { useEffect } from "react";
import type { OwnerTrip } from "../../api/trips";

type UseSelectedOwnerTripLifecycleParams = {
  fillTripEditForm: (trip: OwnerTrip) => void;
  prepareFlightManageForm: (startDate: string) => void;
  prepareScheduleManageForm: (startDate: string) => void;
  resetFlightManageForm: () => void;
  resetPlaceManageForm: () => void;
  resetScheduleManageForm: () => void;
  resetTripEditForm: () => void;
  selectedOwnerTrip: OwnerTrip | null;
};

// 선택 여행이 바뀔 때 상세 화면의 입력 폼을 새 여행 기준으로 맞춘다.
export function useSelectedOwnerTripLifecycle({
  fillTripEditForm,
  prepareFlightManageForm,
  prepareScheduleManageForm,
  resetFlightManageForm,
  resetPlaceManageForm,
  resetScheduleManageForm,
  resetTripEditForm,
  selectedOwnerTrip,
}: UseSelectedOwnerTripLifecycleParams) {
  // reset/prepare 함수들은 렌더마다 새 참조가 될 수 있으므로 선택 여행 변경만 초기화 트리거로 삼는다.
  useEffect(() => {
    if (!selectedOwnerTrip) {
      resetTripEditForm();
      resetScheduleManageForm();
      resetPlaceManageForm();
      resetFlightManageForm();
      return;
    }

    fillTripEditForm(selectedOwnerTrip);
    prepareScheduleManageForm(selectedOwnerTrip.startDate);
    resetPlaceManageForm();
    prepareFlightManageForm(selectedOwnerTrip.startDate);
  }, [selectedOwnerTrip]);
}
