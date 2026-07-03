<!--
PR 제목 = Conventional Commits. 이 레포는 Squash-merge 기준으로 PR 제목이 main 히스토리에 남습니다.
  <type>(<scope>): <subject>
  type:  feat fix refactor perf docs test chore ci build revert security
  scope 예시: frontend backend auth share travel ci docs deps db pwa
  예) feat(frontend): 항공 탭 추가
  예) fix(share): 공개 응답 보안 경계 강화

main 동기화는 rebase 권장:
  git fetch origin main && git rebase origin/main && git push --force-with-lease
-->

## 변경 요약
<!-- 무엇을, 왜 바꿨는지 2-3줄로 작성합니다. 구현 세부사항은 diff가 설명하므로 핵심 의도만 적습니다. -->

## 관련 이슈
- Closes 없음

## 변경 유형
- [ ] `feat` 기능   [ ] `fix` 버그   [ ] `refactor` 동작 변경 없는 개선   [ ] `perf` 성능
- [ ] `docs` 문서   [ ] `test` 테스트   [ ] `security` 보안/권한/공개 데이터 경계   [ ] `ci` 파이프라인
- [ ] `deps` 의존성   [ ] `chore` 기타 유지보수
- [ ] ⚠️ BREAKING CHANGE — 사라지거나 바뀐 인터페이스와 마이그레이션 경로를 변경 요약에 명시합니다.

## 영향 영역
- [ ] Frontend / PWA
- [ ] Backend API
- [ ] Database / schema
- [ ] Auth / owner permission
- [ ] Share link / public read-only response
- [ ] Travel data / schedule / place / route / flight / checklist
- [ ] CI / release / dependency
- [ ] Docs only

## 테스트
```bash
# 해당하는 검증만 남겨주세요.
npm run typecheck
npm run build
cd apps/api && go test ./... -count=1
cd apps/api && go test -race ./... -count=1
cd apps/api && go vet ./...
cd apps/api && test -z "$(gofmt -l .)"
```
<!-- 실행 결과, 스크린샷, 또는 GitHub Actions 결과를 붙이거나 링크합니다. -->

## 체크리스트
- [ ] 제목이 Conventional Commits 형식입니다.
- [ ] 시크릿·크레덴셜·개인정보를 커밋하지 않았습니다.
- [ ] 필요한 테스트 또는 수동 검증을 완료했습니다.
- [ ] 사용자 대면 변경이면 관련 문서 또는 `~/dev/docs/travel_app` 작업 기록을 갱신했습니다.
- [ ] 공개 공유 응답 변경 시 내부 메모·예약번호 등 비공개 데이터 노출 여부를 확인했습니다.

<details>
<summary>가드레일 — 보안 · 데이터 계약 · 비용 (해당 시 펼쳐서 작성)</summary>

### 보안
- [ ] 신규/변경 API는 인증·인가 경계를 확인했습니다.
- [ ] 로그인 없는 공유 화면은 읽기 전용이며 내부 메모를 노출하지 않습니다.
- [ ] JWT, DB URL, API key 등 민감 값은 GitHub Secrets 또는 환경변수를 사용합니다.

### 데이터 계약
- [ ] OpenAPI 또는 DTO 변경 시 프론트 영향 범위를 확인했습니다.
- [ ] DB schema 변경 시 migration/초기 schema와 롤백 가능성을 확인했습니다.
- [ ] 기존 공유 링크와 기존 여행 데이터의 호환성을 확인했습니다.

### 비용
- 월 비용 변화: **+$0 (변화 없음)** 또는 `+$XX (근거)`
- [ ] 신규 외부 서비스/API/지도/번역/스토리지 비용이 있으면 변경 요약에 명시했습니다.

</details>
