import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { expect, it } from "vitest";
import { ManagePlaceList } from "./ManagePlaceList";

it("저장한 장소의 분류를 내부 코드 대신 한국어 이름으로 보여 준다", () => {
  const props = {
    isPlaceListEditing: false,
    ownerDetailDataError: "",
    ownerDetailDataLoading: false,
    ownerPlaces: [{ id: "place-1", name: "센소지", category: "sightseeing", address: "Asakusa, Tokyo" }],
    placeDeleteError: "",
  } as unknown as ComponentProps<typeof ManagePlaceList>;

  render(<ManagePlaceList {...props} />);

  expect(screen.getByText("관광")).toBeVisible();
  expect(screen.queryByText("sightseeing")).not.toBeInTheDocument();
});
