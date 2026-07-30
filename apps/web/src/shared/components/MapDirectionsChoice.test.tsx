import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { MapDirectionsChoice } from "./MapDirectionsChoice";

describe("MapDirectionsChoice", () => {
  it("중국의 Google Places 장소는 고덕지도 검색과 Google 길찾기를 함께 제공한다", async () => {
    const user = userEvent.setup();
    render(
      <MapDirectionsChoice
        destinationCountry="CN"
        place={{
          name: "광저우 타워",
          chineseName: "广州塔",
          latitude: 23.109,
          longitude: 113.319,
          googlePlaceId: "google-place-guangzhou",
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "길찾기 지도 선택" }));

    expect(
      screen.getByRole("group", { name: "길찾기 지도 선택" }),
    ).toBeVisible();

    const amapLink = screen.getByRole("link", { name: "고덕지도에서 찾기" });
    const amapUrl = new URL(amapLink.getAttribute("href")!);
    expect(amapUrl.hostname).toBe("uri.amap.com");
    expect(amapUrl.pathname).toBe("/search");
    expect(amapUrl.searchParams.get("keyword")).toBe("广州塔");
    expect(amapUrl.searchParams.has("city")).toBe(false);

    const googleLink = screen.getByRole("link", { name: "Google 지도" });
    const googleUrl = new URL(googleLink.getAttribute("href")!);
    expect(googleUrl.pathname).toBe("/maps/dir/");
    expect(googleUrl.searchParams.get("destination")).toBe("23.109,113.319");
    expect(googleUrl.searchParams.get("destination_place_id")).toBe(
      "google-place-guangzhou",
    );
  });
});
