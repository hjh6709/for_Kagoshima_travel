---
version: 1
slug: "apps-web-src"
primary_target: "apps/web/src"
related_targets: ["apps/web/src/features/start/StartPage.tsx","apps/web/src/features/trip/TripPage.tsx","apps/web/src/features/manage/TripManagePage.tsx"]
---

Scope: Map Planner 모바일 웹의 시작, 여행 조회, 지도, 일정, 관리 화면. Mode: Operate.

Audience: 전 세계 및 한국 여행을 준비하고 여행 중 한 손으로 다음 장소와 일정을 확인하는 사용자.

Job: 장소를 검색·저장하고 일정에 연결한 뒤, 현재 동선과 다음 행동을 파악해 Google 지도 또는 목적지에 맞는 현지 지도로 길찾기 한다.

Content and constraints: 기존 여행·일정·장소·항공·체크리스트·공유 기능과 한국어 문구를 유지한다. 특정 도시 전용으로 보이지 않아야 하며 사용자가 위도·경도를 직접 입력하는 흐름을 기본으로 삼지 않는다. 모바일 PWA, 불안정한 네트워크, 야외 가독성, 44px 이상 터치 대상을 고려한다.

Direction: The Pocket Atlas. 쿨 화이트 지도 종이, 딥 네이비 잉크, 청록 경로, 코랄 목적지 표식. 날짜는 노선, 일정과 장소는 정류장으로 표현한다.

Memorable moment: 시작 화면의 세 정류장과 여행 화면의 다음 정류장이 같은 시각 언어로 이어지고, 코랄 길찾기 버튼이 목적지 행동을 명확히 마무리한다.

Unresolved decisions: 실제 앱스토어 출시 시 네이티브 플랫폼별 디자인 적응 범위.
