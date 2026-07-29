# React 런타임 흰 화면 복구 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 운영 배포에서 React와 React DOM 버전 불일치로 발생한 전체 흰 화면을 복구하고 같은 문제가 CI를 통과하지 못하게 한다.

**Architecture:** 앱 코드는 변경하지 않고 React 런타임 패키지를 동일한 정확 버전으로 고정한다. 실제 `package.json`과 `package-lock.json`을 읽는 Node 내장 테스트를 빌드 앞에 추가하고 Dependabot의 React 런타임 업데이트를 한 그룹으로 묶는다.

**Tech Stack:** npm, Node.js 22 내장 테스트 러너, React 19.2.8, GitHub Actions, Dependabot

## Global Constraints

- 기존 브랜치 `fix/restore-mypage-bottom-tab`을 재사용한다.
- React와 React DOM은 반드시 동일한 정확 버전이어야 한다.
- 테스트가 먼저 실패한 것을 확인한 뒤 의존성을 수정한다.
- 실제 비밀 값이나 `.env` 파일을 커밋하지 않는다.
- 커밋과 PR 제목은 한국어 Conventional Commit 형식을 사용한다.

---

### Task 1: React 런타임 버전 회귀 테스트

**Files:**
- Create: `apps/web/scripts/react-version-parity.test.mjs`
- Modify: `apps/web/package.json`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `apps/web/package.json`, `apps/web/package-lock.json`
- Produces: `npm run test:dependencies`

- [ ] **Step 1: 실제 패키지 파일을 검사하는 실패 테스트 작성**

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);
const packageLock = JSON.parse(
  readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"),
);

test("react와 react-dom은 선언 버전과 설치 버전이 모두 정확히 일치한다", () => {
  const declaredReact = packageJson.dependencies.react;
  const declaredReactDOM = packageJson.dependencies["react-dom"];
  const installedReact = packageLock.packages["node_modules/react"].version;
  const installedReactDOM = packageLock.packages["node_modules/react-dom"].version;

  assert.match(declaredReact, /^\d+\.\d+\.\d+$/);
  assert.equal(declaredReact, declaredReactDOM);
  assert.equal(installedReact, installedReactDOM);
  assert.equal(declaredReact, installedReact);
});
```

- [ ] **Step 2: 현재 상태에서 테스트가 올바른 이유로 실패하는지 확인**

Run:

```bash
cd apps/web
node --test scripts/react-version-parity.test.mjs
```

Expected: `^19.2.8`이 정확 버전 형식이 아니거나 설치된 `react 19.2.8`과 `react-dom 19.2.7`이 다르다는 assertion failure.

- [ ] **Step 3: 의존성 검사 명령을 패키지 스크립트와 CI에 연결**

`apps/web/package.json`:

```json
{
  "scripts": {
    "test:dependencies": "node --test scripts/react-version-parity.test.mjs"
  }
}
```

`.github/workflows/ci.yml`의 프론트엔드 설치 다음 단계:

```yaml
- name: Check frontend dependency contracts
  run: npm run test:dependencies
```

- [ ] **Step 4: 테스트가 계속 실패하는지 확인**

Run: `cd apps/web && npm run test:dependencies`

Expected: Task 1 Step 2와 같은 버전 불일치 실패.

### Task 2: React 버전 정합성 복구

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/package-lock.json`
- Modify: `.github/dependabot.yml`
- Test: `apps/web/scripts/react-version-parity.test.mjs`

**Interfaces:**
- Consumes: Task 1의 `npm run test:dependencies`
- Produces: 동일한 정확 버전의 React 런타임과 함께 생성된 프로덕션 번들

- [ ] **Step 1: React와 React DOM을 동일한 정확 버전으로 설치**

Run:

```bash
cd apps/web
npm install --save-exact react@19.2.8 react-dom@19.2.8
```

Expected: `package.json`과 lockfile 모두 두 패키지를 `19.2.8`로 기록.

- [ ] **Step 2: Dependabot React 런타임 그룹 추가**

`.github/dependabot.yml`의 npm 업데이트 설정:

```yaml
groups:
  react-runtime:
    patterns:
      - react
      - react-dom
```

- [ ] **Step 3: 회귀 테스트가 통과하는지 확인**

Run: `cd apps/web && npm run test:dependencies`

Expected: 1 test, 1 pass, 0 fail.

- [ ] **Step 4: 프로덕션 빌드 확인**

Run: `cd apps/web && npm run build`

Expected: TypeScript와 Vite 빌드 exit code 0.

- [ ] **Step 5: 변경사항 커밋**

```bash
git add .github/dependabot.yml .github/workflows/ci.yml apps/web/package.json apps/web/package-lock.json apps/web/scripts/react-version-parity.test.mjs
git commit -m "fix(frontend): React 버전 불일치 흰 화면 복구"
```

### Task 3: 운영 증상 회귀 검증

**Files:**
- No production file changes

**Interfaces:**
- Consumes: Task 2의 프로덕션 빌드
- Produces: PR에서 검증 가능한 긴급 복구 변경

- [ ] **Step 1: 깨끗한 설치와 전체 프론트 검증**

Run:

```bash
cd apps/web
npm ci
npm run test:dependencies
npm run typecheck
npm run build
```

Expected: 모든 명령 exit code 0.

- [ ] **Step 2: Git diff와 비밀 값 점검**

Run:

```bash
git diff --check
git status --short
git diff -- .github/dependabot.yml .github/workflows/ci.yml apps/web/package.json apps/web/package-lock.json apps/web/scripts/react-version-parity.test.mjs
```

Expected: 의도한 파일만 변경되고 키, 토큰, `.env`가 없음.

- [ ] **Step 3: 기존 브랜치 푸시 후 PR 생성**

```bash
git push origin fix/restore-mypage-bottom-tab
gh pr create --base main --head fix/restore-mypage-bottom-tab --title "fix(frontend): React 버전 불일치 흰 화면 복구" --body-file /tmp/2026-07-29-react-runtime-crash-pr.md
```

Expected: 운영 복구만 포함한 PR URL 생성.
