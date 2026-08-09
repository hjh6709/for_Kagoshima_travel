import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BottomSheet } from "../../../../shared/components/BottomSheet";
import { SurvivalPhraseWidget } from "./SurvivalPhraseWidget";

describe("SurvivalPhraseWidget nested dialog", () => {
  it("확대 문구가 키보드 포커스를 가두고 첫 Escape만 소비한다", async () => {
    const onCloseToolSheet = vi.fn();
    const user = userEvent.setup();

    render(
      <BottomSheet ariaLabel="택시 · 식당 문구" onClose={onCloseToolSheet}>
        <SurvivalPhraseWidget destinationCountry="CN" />
      </BottomSheet>,
    );

    const openPhraseButton = screen.getByRole("button", { name: "안녕하세요 문장 크게 보기" });
    await user.click(openPhraseButton);

    const closePhraseButton = screen.getByRole("button", { name: "큰 문장 닫기" });
    expect(closePhraseButton).toHaveFocus();

    await user.tab();
    expect(closePhraseButton).toHaveFocus();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("button", { name: "큰 문장 닫기" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "택시 · 식당 문구" })).toBeVisible();
    expect(onCloseToolSheet).not.toHaveBeenCalled();
    expect(openPhraseButton).toHaveFocus();
  });
});
