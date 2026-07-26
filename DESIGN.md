---
name: Map Planner
description: 일정을 노선처럼 읽고 장소를 정류장처럼 찾는 모바일 여행 아틀라스
colors:
  atlas-ink: "#17333D"
  route-teal: "#0B6F6A"
  route-teal-deep: "#075A57"
  destination-coral: "#C94F3D"
  canvas-mist: "#EDF3F2"
  surface-white: "#FFFFFF"
  surface-cool: "#F5F8F7"
  border-map: "#CAD8D7"
  text-muted: "#4C626A"
  warning-amber: "#9A6500"
  danger-red: "#B33A3A"
  success-green: "#25734B"
typography:
  display:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 800
    lineHeight: 1.18
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 750
    lineHeight: 1.35
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.6
  label:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1.3
rounded:
  control: "10px"
  card: "14px"
  sheet: "20px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.route-teal}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
    height: "48px"
  button-destination:
    backgroundColor: "{colors.destination-coral}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
    height: "48px"
  card:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.atlas-ink}"
    rounded: "{rounded.card}"
    padding: "18px"
---

<!--
THESIS: 일정과 장소를 카드 목록이 아니라 이동 가능한 하나의 노선으로 보여 준다. 흔한 크림색 여행 다이어리 화면은 사용하지 않는다.
OWN-WORLD: 쿨 화이트 지도 종이, 딥 네이비 잉크, 청록 노선, 코랄 목적지 표식, 얇은 지도선과 정류장 점.
STORY: 사용자는 현재 여행과 다음 행동을 파악하고, 날짜·장소·길찾기로 자연스럽게 이동한다.
FIRST VIEWPORT: 여행명과 기간 아래에 현재 상태와 다음 일정이 노선의 시작점처럼 이어지고, 가장 중요한 행동은 엄지 영역에 놓인다.
FORM: 포켓 아틀라스와 대중교통 안내도를 결합한 Operate 화면. 날짜는 노선, 일정은 정류장, 완료는 지나온 구간으로 표현한다.
-->

# Design System: Map Planner

## Overview

**Creative North Star: "The Pocket Atlas"**

Map Planner는 여행 중 한 손에 들고 보는 접이식 도시 지도와 대중교통 안내도의 명료함을 디지털 화면으로 옮깁니다. 장식적인 여행 감성보다 현재 위치, 다음 일정, 이동 선택을 빠르게 읽는 것이 우선이며, 브랜드의 개성은 노선과 정류장이라는 반복 문법에서 드러납니다.

화면은 밝은 야외에서도 읽히는 쿨 화이트 바탕과 짙은 지도 잉크를 사용합니다. 청록은 현재 경로와 선택, 코랄은 목적지와 중요한 행동에만 제한합니다. 국가나 도시가 바뀌어도 같은 안내 체계가 유지됩니다.

**Key Characteristics:**

- 일정과 장소를 연결하는 노선·정류장 문법
- 쿨 화이트 종이와 짙은 네이비 지도 잉크
- 현재 경로를 나타내는 청록과 목적지를 나타내는 코랄
- 작은 화면에서 먼저 성립하는 조밀하고 명확한 정보 구조

## Colors

차가운 지도 종이 위에 네이비 잉크를 쓰고, 경로와 목적지에만 색을 부여합니다.

### Primary

- **Route Teal** (`#0B6F6A`): 선택된 탭, 주요 버튼, 현재 경로와 포커스에 사용합니다.
- **Route Teal Deep** (`#075A57`): 눌림 상태와 짙은 강조에 사용합니다.

### Secondary

- **Destination Coral** (`#C94F3D`): 목적지 표식, 다음 핵심 행동과 여행 중 활성 상태에만 사용합니다.

### Neutral

- **Atlas Ink** (`#17333D`): 제목과 본문 핵심 텍스트입니다.
- **Canvas Mist** (`#EDF3F2`): 앱 바깥과 화면의 지도 종이 배경입니다.
- **Surface White** (`#FFFFFF`): 읽기 영역과 카드 표면입니다.
- **Surface Cool** (`#F5F8F7`): 선택되지 않은 컨트롤과 보조 구역입니다.
- **Map Border** (`#CAD8D7`): 카드 경계, 노선의 비활성 구간과 구분선입니다.
- **Text Muted** (`#4C626A`): 설명, 날짜, 보조 정보입니다.

### Named Rules

**The Route and Destination Rule.** 청록은 현재 경로와 선택, 코랄은 목적지와 가장 중요한 행동만 나타냅니다. 같은 화면에서 두 색을 장식적으로 반복하지 않습니다.

**The No Gold Rule.** 골드·머스터드 계열은 브랜드 강조색으로 사용하지 않습니다. 경고가 필요할 때만 의미가 명확한 앰버를 제한적으로 사용합니다.

## Typography

**Display Font:** Pretendard Variable
**Body Font:** Pretendard Variable
**Label Font:** Pretendard Variable

**Character:** 한국어와 다국어 장소명이 함께 나타나는 운영 화면이므로 하나의 가변 산세리프로 위계를 만듭니다. 지도 표지처럼 굵은 제목과 안정적인 본문 리듬을 사용합니다.

### Hierarchy

- **Display** (800, 32px, 1.18): 여행명과 화면의 단 하나뿐인 최상위 제목
- **Headline** (800, 26px, 1.25): 주요 화면 제목
- **Title** (750, 20px, 1.35): 일정과 장소 이름
- **Body** (500, 15px, 1.6): 설명과 안내
- **Label** (700, 12px, 1.3): 시간, 범주, 상태, 짧은 메타데이터

### Named Rules

**The Place Name Rule.** 장소명은 메타데이터보다 먼저 읽혀야 하며, 현지어 이름은 번역명 아래 한 단계 낮은 위계로 둡니다.

## Layout

기본 화면은 최대 430px의 모바일 캔버스이며 실제 모바일에서는 전체 뷰포트를 사용합니다. 화면 좌우 여백은 20px, 관련 항목 간격은 8–12px, 섹션 간격은 24–32px입니다. 하단 내비게이션은 안전 영역을 포함하고, 주요 행동은 최소 44px의 터치 영역을 확보합니다.

일정과 지도 목록은 세로 노선을 공유합니다. 시간·정류장 표식이 고정된 좁은 열을 차지하고, 장소와 행동이 나머지 폭을 사용합니다. 데스크톱에서는 모바일 앱을 미리 보는 프레임으로 중앙 배치하되 화면 자체의 정보 구조는 바꾸지 않습니다.

## Elevation & Depth

표면은 기본적으로 평면이며 배경색과 1px 경계로 구분합니다. 그림자는 앱 프레임, 오버레이, 떠 있는 알림처럼 실제로 겹치는 요소에만 사용합니다.

### Shadow Vocabulary

- **Frame Ambient** (`0 24px 64px rgba(23, 51, 61, 0.14)`): 데스크톱의 모바일 프레임
- **Overlay Lift** (`0 16px 40px rgba(23, 51, 61, 0.18)`): 모달과 전역 알림

### Named Rules

**The Flat Map Rule.** 일반 카드에는 그림자를 사용하지 않습니다. 경계와 표면색으로 계층을 만들고, 그림자는 실제 중첩에만 대응합니다.

## Shapes

입력과 버튼은 10px, 카드와 목록은 14px, 큰 시트와 앱 프레임은 20px를 사용합니다. 작은 상태 배지만 완전한 알약 형태를 허용합니다. 노선은 둥근 선 끝과 원형 정류장 표식으로 표현합니다.

## Components

### Buttons

- **Shape:** 10px 반경, 최소 높이 44px
- **Primary:** Route Teal 배경과 흰색 텍스트
- **Destination:** Destination Coral 배경과 흰색 텍스트, 화면당 하나의 핵심 행동에만 사용
- **Secondary:** Surface Cool 배경 또는 Map Border 테두리와 Atlas Ink 텍스트
- **Hover / Focus:** 색을 한 단계 짙게 하고 3px 반투명 Route Teal 포커스 링을 표시

### Chips

- **Style:** 작은 상태와 범주에만 사용하며 Surface Cool 또는 옅은 의미색 배경을 사용
- **State:** 선택된 날짜·필터는 Route Teal 배경과 흰색 텍스트

### Cards / Containers

- **Corner Style:** 14px
- **Background:** Surface White
- **Shadow Strategy:** 기본 그림자 없음
- **Border:** Map Border 1px
- **Internal Padding:** 16–20px

### Inputs / Fields

- **Style:** 흰 배경, Map Border 1px, 10px 반경, 최소 48px 높이
- **Focus:** Route Teal 테두리와 옅은 포커스 링
- **Error / Disabled:** 오류는 Danger Red와 오류 설명을 함께 사용하며, 비활성 상태는 색상뿐 아니라 투명도와 커서로 구분

### Navigation

하단 내비게이션은 흰색 불투명 표면과 상단 경계를 사용합니다. 활성 탭은 청록 아이콘·텍스트와 작은 노선 표식으로 나타내며 큰 색상 덩어리나 빛나는 효과를 사용하지 않습니다.

### Route Timeline

시간, 정류장 점, 연결선, 장소 내용을 하나의 행 구조로 묶습니다. 완료한 정류장은 Success Green과 체크 아이콘으로 표시하고, 다음 정류장은 Destination Coral로 강조합니다.

## Do's and Don'ts

### Do:

- **Do** 지도와 일정 화면에서 같은 노선·정류장 문법을 사용합니다.
- **Do** 장소명, 시간, 다음 행동의 읽기 순서를 분명히 합니다.
- **Do** 청록과 코랄이 행동 또는 상태를 설명할 때만 사용합니다.
- **Do** 실제 모바일의 안전 영역과 야외 가독성을 확인합니다.

### Don't:

- **Don't** 골드·머스터드를 브랜드 포인트로 사용하지 않습니다.
- **Don't** 모든 정보를 같은 크기의 둥근 카드 안에 넣지 않습니다.
- **Don't** 그라디언트, 유리 효과, 네온 글로우로 지도 분위기를 흉내 내지 않습니다.
- **Don't** 사용자가 위도와 경도를 직접 입력하도록 기본 흐름을 설계하지 않습니다.
