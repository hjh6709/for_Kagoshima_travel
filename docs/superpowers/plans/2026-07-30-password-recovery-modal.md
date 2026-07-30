# 비밀번호 찾기 모달 복구 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 비밀번호 찾기 모달의 모바일 입력 폭 회귀를 고치고, 기존 인증 API를 이용해 인증코드 요청부터 임시 비밀번호 발급까지 완료할 수 있게 한다.

**Architecture:** `ForgotPasswordModal`이 이메일 인증코드 요청과 임시 비밀번호 발급 상태를 소유한다. 기존 `sendVerificationCode(email, "forgot")`와 `forgotPassword(email, code)`만 호출하며, 모달 레이아웃은 `manage.css`의 전용 클래스와 공통 `auth-form` 디자인 시스템을 조합한다.

**Tech Stack:** React 19.2.8, TypeScript, Vitest, Testing Library, CSS, Browser Geolocation과 무관한 인증 REST API

## Global Constraints

- 새 API와 DB 변경을 추가하지 않는다.
- 기존 `sendVerificationCode`와 `forgotPassword`를 재사용한다.
- 입력과 주요 버튼의 최소 높이는 48px, 기타 터치 대상은 최소 44px이다.
- 376px 모바일 뷰포트에서 입력 폭은 입력 래퍼 폭의 98% 이상이어야 한다.
- 실제 API 호출 전 실패 테스트를 확인한다.
- 모달의 실제 동작과 접근성 결과를 테스트하고 소스 문자열을 검사하는 테스트는 만들지 않는다.
- 기존 Pocket Atlas 색상·간격·모서리 토큰을 사용하고 골드·그라디언트·일반 카드 그림자를 추가하지 않는다.

---

### Task 1: 모달 접근성과 전체 폭 폼 구조

**Files:**
- Create: `apps/web/src/features/manage/components/sections/ForgotPasswordModal.test.tsx`
- Modify: `apps/web/src/features/manage/components/sections/ForgotPasswordModal.tsx`
- Modify: `apps/web/src/styles/manage.css`

**Interfaces:**
- Consumes: `ForgotPasswordModalProps`
- Produces: 접근 가능한 `dialog`와 공통 `.auth-form` 규칙을 사용하는 비밀번호 복구 폼

- [ ] **Step 1: 접근성·폼 구조 실패 테스트 작성**

```tsx
it("접근 가능한 dialog 안에 이메일과 인증코드 입력을 제공한다", () => {
  render(<ForgotPasswordModal onClose={vi.fn()} onSuccessToast={vi.fn()} />);

  const dialog = screen.getByRole("dialog", { name: "비밀번호 찾기" });
  expect(dialog).toHaveAttribute("aria-modal", "true");
  expect(screen.getByRole("button", { name: "비밀번호 찾기 닫기" })).toBeInTheDocument();
  expect(screen.getByLabelText("계정 이메일")).toHaveAttribute("type", "email");
  expect(screen.getByLabelText("6자리 인증코드")).toHaveAttribute("inputmode", "numeric");
  expect(dialog.querySelector("form")).toHaveClass("auth-form", "forgot-password-form");
});
```

- [ ] **Step 2: 테스트가 올바른 이유로 실패하는지 확인**

Run:

```bash
cd apps/web
npm run test:unit -- src/features/manage/components/sections/ForgotPasswordModal.test.tsx
```

Expected: `dialog` 역할이나 `비밀번호 찾기 닫기` 이름을 찾지 못해 FAIL.

- [ ] **Step 3: 최소 dialog 구조와 전용 클래스 구현**

`ForgotPasswordModal.tsx`의 인라인 레이아웃을 아래 구조로 교체한다.

```tsx
<div className="forgot-password-overlay">
  <section
    aria-describedby="forgot-password-description"
    aria-labelledby="forgot-password-title"
    aria-modal="true"
    className="forgot-password-dialog"
    role="dialog"
  >
    <button aria-label="비밀번호 찾기 닫기" className="forgot-password-close" />
    <h2 id="forgot-password-title">비밀번호 찾기</h2>
    <p id="forgot-password-description">가입 이메일로 인증코드를 받은 뒤 임시 비밀번호를 발급하세요.</p>
    <form className="auth-form forgot-password-form">
      {/* 이메일과 6자리 인증코드 필드 */}
    </form>
  </section>
</div>
```

`manage.css`에 다음 역할의 클래스를 추가한다.

```css
.forgot-password-overlay { position: fixed; inset: 0; overflow-y: auto; }
.forgot-password-dialog { width: min(100%, 380px); }
.forgot-password-form { margin-top: 0; }
.forgot-password-form .input-with-icon,
.forgot-password-form input { width: 100%; min-width: 0; }
.forgot-password-close { width: 44px; height: 44px; }
```

- [ ] **Step 4: 단위 테스트 통과 확인**

Run:

```bash
cd apps/web
npm run test:unit -- src/features/manage/components/sections/ForgotPasswordModal.test.tsx
```

Expected: 1 test PASS.

- [ ] **Step 5: Task 1 커밋**

```bash
git add apps/web/src/features/manage/components/sections/ForgotPasswordModal.tsx apps/web/src/features/manage/components/sections/ForgotPasswordModal.test.tsx apps/web/src/styles/manage.css
git commit -m "fix(frontend): 비밀번호 모달 모바일 레이아웃 복구"
```

### Task 2: 비밀번호 찾기 인증코드 요청 흐름

**Files:**
- Modify: `apps/web/src/features/manage/components/sections/ForgotPasswordModal.test.tsx`
- Modify: `apps/web/src/features/manage/components/sections/ForgotPasswordModal.tsx`

**Interfaces:**
- Consumes: `sendVerificationCode(email: string, purpose: string)`
- Produces: 인증코드 전송 중·성공·실패 상태와 `purpose="forgot"` 요청

- [ ] **Step 1: 인증코드 요청 실패 테스트 작성**

```tsx
it("가입 이메일로 비밀번호 찾기 인증코드를 요청한다", async () => {
  const user = userEvent.setup();
  vi.mocked(sendVerificationCode).mockResolvedValue({ code: "" });
  render(<ForgotPasswordModal onClose={vi.fn()} onSuccessToast={vi.fn()} />);

  await user.type(screen.getByLabelText("계정 이메일"), "traveler@example.com");
  await user.click(screen.getByRole("button", { name: "인증코드 받기" }));

  expect(sendVerificationCode).toHaveBeenCalledWith("traveler@example.com", "forgot");
  expect(await screen.findByRole("status")).toHaveTextContent("인증코드를 이메일로 보냈습니다");
});
```

- [ ] **Step 2: 테스트가 올바른 이유로 실패하는지 확인**

Run:

```bash
cd apps/web
npm run test:unit -- src/features/manage/components/sections/ForgotPasswordModal.test.tsx
```

Expected: `인증코드 받기` 버튼이 없어 FAIL.

- [ ] **Step 3: 인증코드 전송 상태 구현**

`ForgotPasswordModal.tsx`에 다음 상태와 핸들러를 추가한다.

```tsx
const [sendingCode, setSendingCode] = useState(false);
const [codeSent, setCodeSent] = useState(false);
const [status, setStatus] = useState("");
const [developmentCode, setDevelopmentCode] = useState("");

const handleSendCode = async () => {
  setSendingCode(true);
  setError("");
  try {
    const result = await sendVerificationCode(email.trim(), "forgot");
    setCodeSent(true);
    setDevelopmentCode(window.location.hostname === "localhost" ? result.code : "");
    setStatus("인증코드를 이메일로 보냈습니다. 5분 안에 입력해 주세요.");
  } catch (requestError) {
    setStatus("");
    setError(requestError instanceof Error ? requestError.message : "인증코드를 보내지 못했습니다.");
  } finally {
    setSendingCode(false);
  }
};
```

이메일이 HTML email 제약을 통과하지 못하면 외부 요청 없이 `올바른 이메일 주소를 입력해 주세요.`를 표시한다. 성공 후 버튼 문구는 `인증코드 다시 받기`로 바꾼다.

- [ ] **Step 4: 전송 성공·실패 테스트 통과 확인**

Run:

```bash
cd apps/web
npm run test:unit -- src/features/manage/components/sections/ForgotPasswordModal.test.tsx
```

Expected: 인증코드 요청 테스트와 기존 접근성 테스트 PASS.

- [ ] **Step 5: Task 2 커밋**

```bash
git add apps/web/src/features/manage/components/sections/ForgotPasswordModal.tsx apps/web/src/features/manage/components/sections/ForgotPasswordModal.test.tsx
git commit -m "fix(frontend): 비밀번호 찾기 인증코드 요청 추가"
```

### Task 3: 임시 비밀번호 발급·복사 오류 처리

**Files:**
- Modify: `apps/web/src/features/manage/components/sections/ForgotPasswordModal.test.tsx`
- Modify: `apps/web/src/features/manage/components/sections/ForgotPasswordModal.tsx`
- Modify: `apps/web/src/styles/manage.css`

**Interfaces:**
- Consumes: `forgotPassword(email: string, code: string)`
- Produces: 임시 비밀번호 결과 패널과 안전한 복사·닫기 흐름

- [ ] **Step 1: 임시 비밀번호 발급 실패 테스트 작성**

```tsx
it("6자리 인증코드로 임시 비밀번호를 발급하고 표시한다", async () => {
  const user = userEvent.setup();
  vi.mocked(forgotPassword).mockResolvedValue({ temporaryPassword: "Ab12!xyz" });
  render(<ForgotPasswordModal onClose={vi.fn()} onSuccessToast={vi.fn()} />);

  await user.type(screen.getByLabelText("계정 이메일"), "traveler@example.com");
  await user.type(screen.getByLabelText("6자리 인증코드"), "123456");
  await user.click(screen.getByRole("button", { name: "임시 비밀번호 생성" }));

  expect(forgotPassword).toHaveBeenCalledWith("traveler@example.com", "123456");
  expect(await screen.findByText("Ab12!xyz")).toBeInTheDocument();
});
```

- [ ] **Step 2: 테스트가 올바른 이유로 실패하는지 확인**

Run:

```bash
cd apps/web
npm run test:unit -- src/features/manage/components/sections/ForgotPasswordModal.test.tsx
```

Expected: 새 결과 패널 또는 새 버튼 구조가 없어 FAIL.

- [ ] **Step 3: 발급·복사 상태 구현**

기존 `forgotPassword` 호출을 유지하되 이메일을 trim하고 인증코드는 숫자 6자리만 받는다. 복사는 다음 계약을 따른다.

```tsx
const handleCopyAndClose = async () => {
  if (!navigator.clipboard || !tempPassword) {
    setError("이 브라우저에서는 자동 복사를 지원하지 않습니다. 임시 비밀번호를 직접 복사해 주세요.");
    return;
  }
  try {
    await navigator.clipboard.writeText(tempPassword);
    onSuccessToast("임시 비밀번호를 복사했습니다.");
    onClose();
  } catch {
    setError("임시 비밀번호를 복사하지 못했습니다. 직접 복사한 뒤 로그인해 주세요.");
  }
};
```

복사 실패 시 모달을 닫지 않고 임시 비밀번호를 계속 표시한다.

- [ ] **Step 4: 발급·복사 테스트 통과 확인**

Run:

```bash
cd apps/web
npm run test:unit -- src/features/manage/components/sections/ForgotPasswordModal.test.tsx
```

Expected: 전체 모달 테스트 PASS.

- [ ] **Step 5: Task 3 커밋**

```bash
git add apps/web/src/features/manage/components/sections/ForgotPasswordModal.tsx apps/web/src/features/manage/components/sections/ForgotPasswordModal.test.tsx apps/web/src/styles/manage.css
git commit -m "fix(frontend): 임시 비밀번호 발급 상태 보완"
```

### Task 4: 모바일 원본 증상과 전체 회귀 검증

**Files:**
- Verify: `apps/web/src/features/manage/components/sections/ForgotPasswordModal.tsx`
- Verify: `apps/web/src/styles/manage.css`

**Interfaces:**
- Consumes: Task 1~3의 완성된 모달
- Produces: 376px 브라우저 계산 폭과 전체 프로젝트 검증 결과

- [ ] **Step 1: Impeccable UI detector 실행**

Run:

```bash
node .agents/skills/impeccable/scripts/detect.mjs --json \
  apps/web/src/features/manage/components/sections/ForgotPasswordModal.tsx \
  apps/web/src/styles/manage.css
```

Expected: blocking severity finding 없음. 실행은 UI 변경이 끝난 뒤 한 번만 한다.

- [ ] **Step 2: 프론트 전체 검증**

Run:

```bash
cd apps/web
npm run test
npm run typecheck
npm run build
```

Expected: dependency test와 전체 Vitest, TypeScript, Vite build 모두 exit code 0.

- [ ] **Step 3: 모바일 브라우저 계산 폭 검증**

376×667 뷰포트의 `/manage`에서 비밀번호 찾기 모달을 열고 다음 조건을 확인한다.

```js
const ratio = input.getBoundingClientRect().width /
  input.parentElement.getBoundingClientRect().width;

if (ratio < 0.98) throw new Error(`입력 폭 비율 실패: ${ratio}`);
```

Expected: 입력 폭 비율 `>= 0.98`, 모달 카드 오른쪽 좌표 `<= 376`.

- [ ] **Step 4: diff와 비밀정보 검증**

Run:

```bash
git diff --check origin/main...HEAD
rg -n "AIza[0-9A-Za-z_-]{20,}|BEGIN .*PRIVATE KEY" \
  apps/web/src docs/superpowers
```

Expected: 공백 오류와 실제 키·개인키 패턴 없음.

- [ ] **Step 5: 브랜치 푸시와 PR 생성**

PR 제목:

```text
fix(frontend): 비밀번호 찾기 모바일 흐름 복구
```

저장소 `.github/pull_request_template.md`를 사용해 원인, 테스트, API·DB 무변경, 모바일 계산 폭 결과를 기록한다.
