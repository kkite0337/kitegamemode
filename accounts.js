const SITE_DOMAIN = "kitegamemode.kr";

// 로그인 아이디와 비밀번호는 여기서 직접 설정합니다.
// role: "user" → 사용자 페이지, "admin" → 관리자 페이지
const ACCOUNTS = [
  { id: "USER1", password: "1234", role: "user" },
  { id: "USER2", password: "1234", role: "user" },
  { id: "USER3", password: "1234", role: "user" },
  { id: "USER4", password: "1234", role: "user" },
  { id: "USER100", password: "1234", role: "joke" },
  { id: "ADMIN", password: "1234", role: "admin" },
];

// 나중에 실제 계좌번호로 바꾸면 됩니다.
const ACCOUNT_NUMBER = "";

// 여러 폰이 같은 참가자/게임 상태를 보게 하는 공유 저장소입니다.
const SYNC_GIST_ID = "b403b487c2824c948b2ec9ef15c52aa3";
const SYNC_GIST_FILE = "sync-init.json";
const SYNC_URL = "https://api.github.com/gists/b403b487c2824c948b2ec9ef15c52aa3";
const SYNC_ROOM = "kitegamemodekrv1";
const SYNC_WS =
  "wss://demo.piesocket.com/v3/kitegamemodekrv1?api_key=VCXCEuvhGcBDP7XhiJJUDvR1e1D3eiVjgZ9VRiaV&notify_self=1";
const SYNC_MQTT = "wss://broker.hivemq.com:8884/mqtt";
const SYNC_MQTT_FALLBACK = "wss://broker.emqx.io:8084/mqtt";
const SYNC_MQTT_PREFIX = "kitegamemode/kr/live";
const SYNC_MQTT_LEGACY_PREFIXES = [
  "kitegamemode/kr/v21",
  "kitegamemode/kr/v22",
  "kitegamemode/kr/v23",
];

const GAME_CHOICES = [
  { id: "drink", label: "음료를 고르자!" },
  { id: "game2", label: "메뉴고르기" },
  { id: "game3", label: "미니게임" },
  { id: "stop", label: "멈춰!" },
];

const MINI_GAME_CHOICES = [
  { id: "winner", label: "당첨자" },
  { id: "game-count", label: "게임진행" },
  { id: "real-count", label: "실제카운팅" },
  { id: "score", label: "점수" },
];

const PLAY_WHEEL_VALUES = [
  "10초 맞추기",
  "랜덤 시간 맞추기",
  "초록신호 누르기",
  "색깔 반응 게임",
  "반응속도 테스트",
  "정확한 위치 클릭",
  "기억력 게임",
  "이모티콘 순서 맞추기",
  "완벽한도형그리기",
  "완벽한 선 그리기",
  "사라진 것 찾기",
  "악어이빨",
  "숫자 예측하기",
];

const WINNER_MODE_CHOICES = [
  { id: "immediate", label: "바로당첨" },
  { id: "after", label: "진행후당첨" },
];

const WINNER_BOX_COLORS = ["red", "yellow", "blue", "green"];
const WINNER_BOX_EMOJI = {
  red: "🎁",
  yellow: "🎁",
  blue: "🎁",
  green: "🎁",
};
