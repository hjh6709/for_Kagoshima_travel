export interface Phrase {
  korean: string;        // 한국어 본래 문장
  foreign: string;       // 현지 번역어 (일어/중국어 한자)
  pronunciation: string; // 한글 발음 표기법 (현지 소통 가독성 지원)
}

// 일본 여행 시 유용한 퀵 서바이벌 9개 회화 리스트
export const JAPANESE_PHRASES: Phrase[] = [
  { korean: "안녕하세요", foreign: "こんにちは", pronunciation: "콘니치와" },
  { korean: "감사합니다", foreign: "ありがとうございます", pronunciation: "아리가토고자이마스" },
  { korean: "실례합니다 / 저기요", foreign: "すみません", pronunciation: "스미마센" },
  { korean: "이것은 얼마입니까?", foreign: "これはいくらですか？", pronunciation: "코레와 이쿠라데스카?" },
  { korean: "이거 주세요", foreign: "これください", pronunciation: "코레 쿠다사이" },
  { korean: "화장실은 어디입니까?", foreign: "お手洗いはどこですか？", pronunciation: "오테아라이와 도코데스카?" },
  { korean: "카드 결제 가능한가요?", foreign: "カードは使えますか？", pronunciation: "카-도와 츠카에마스카?" },
  { korean: "한국어 메뉴판 있나요?", foreign: "韓国語のメニューはありますか？", pronunciation: "칸코쿠고노 메뉴-와 아리마스카?" },
  { korean: "도와주세요 (긴급)", foreign: "助けてください", pronunciation: "타스케테 쿠다사이" },
];

// 중국 여행 시 유용한 퀵 서바이벌 9개 회화 리스트 (여정 상황 맞춤형)
export const CHINESE_PHRASES: Phrase[] = [
  { korean: "안녕하세요", foreign: "你好", pronunciation: "니하오" },
  { korean: "감사합니다", foreign: "谢谢", pronunciation: "시에시에" },
  { korean: "실례합니다 / 저기요", foreign: "打扰一下 / 那个", pronunciation: "다라오 이시아 / 네이거" },
  { korean: "이것은 얼마입니까?", foreign: "这个多少钱？", pronunciation: "쩌거 뚜오샤오 치엔?" },
  { korean: "이거 주세요", foreign: "要这个", pronunciation: "야오 쩌거" },
  { korean: "화장실은 어디입니까?", foreign: "洗手间在哪里？", pronunciation: "시쇼우지엔 짜이 나리?" },
  { korean: "카드 결제 가능한가요?", foreign: "可以刷卡吗？", pronunciation: "커이 슈아카 마?" },
  { korean: "고수 빼주세요", foreign: "不要香菜", pronunciation: "부야오 시앙차이" },
  { korean: "도와주세요 (긴급)", foreign: "请帮帮我", pronunciation: "칭 방방 워" },
];
