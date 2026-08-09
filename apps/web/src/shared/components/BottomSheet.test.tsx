import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BottomSheet } from "./BottomSheet";

describe("BottomSheet", () => {
  it("전달한 내용을 대화 상자 안에 보여준다", () => {
    render(
      <BottomSheet ariaLabel="환율 계산" onClose={vi.fn()}>
        <p>내용</p>
      </BottomSheet>,
    );

    expect(screen.getByRole("dialog", { name: "환율 계산" })).toBeVisible();
    expect(screen.getByText("내용")).toBeVisible();
  });

  it("닫기 버튼을 누르면 닫힘을 알린다", async () => {
    const onClose = vi.fn();
    render(
      <BottomSheet ariaLabel="환율 계산" onClose={onClose}>
        <p>내용</p>
      </BottomSheet>,
    );

    await userEvent.click(screen.getByRole("button", { name: "닫기" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Escape 키로도 닫을 수 있다", async () => {
    const onClose = vi.fn();
    render(
      <BottomSheet ariaLabel="환율 계산" onClose={onClose}>
        <p>내용</p>
      </BottomSheet>,
    );

    await userEvent.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
