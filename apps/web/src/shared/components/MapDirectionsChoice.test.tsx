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
    expect(
      screen.getByText("고덕지도에서는 장소를 확인한 뒤 길찾기를 눌러 주세요."),
    ).toBeVisible();

    const amapLink = screen.getByRole("link", { name: "고덕지도 위치 보기" });
    const amapUrl = new URL(amapLink.getAttribute("href")!);
    expect(amapUrl.hostname).toBe("uri.amap.com");
    expect(amapUrl.pathname).toBe("/marker");
    expect(amapUrl.searchParams.get("position")).toBe("113.319,23.109");
    expect(amapUrl.searchParams.get("name")).toBe("广州塔");
    expect(amapUrl.searchParams.get("coordinate")).toBe("wgs84");

    const googleLink = screen.getByRole("link", { name: "Google 지도" });
    const googleUrl = new URL(googleLink.getAttribute("href")!);
    expect(googleUrl.pathname).toBe("/maps/dir/");
    expect(googleUrl.searchParams.get("destination")).toBe("23.109,113.319");
    expect(googleUrl.searchParams.get("destination_place_id")).toBe(
      "google-place-guangzhou",
    );
  });

  it("GCJ-02 좌표가 확인된 중국 장소는 고덕지도 길찾기로 바로 연결한다", async () => {
    const user = userEvent.setup();
    render(
      <MapDirectionsChoice
        destinationCountry="CN"
        place={{
          name: "상하이 타워",
          chineseName: "上海中心大厦",
          coordinateSystem: "gcj02",
          latitude: 31.23351,
          longitude: 121.505366,
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "길찾기 지도 선택" }));

    expect(screen.getByText("사용할 지도 앱을 선택하세요")).toBeVisible();
    const amapLink = screen.getByRole("link", { name: "고덕지도" });
    const amapUrl = new URL(amapLink.getAttribute("href")!);
    expect(amapUrl.pathname).toBe("/navigation");
    expect(amapUrl.searchParams.get("to")).toBe("121.505366,31.23351,上海中心大厦");
  });
});
