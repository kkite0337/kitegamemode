const SITE_DOMAIN = "kitegamemode.kr";

// 로그인 아이디와 비밀번호는 여기서 직접 설정합니다.
// role: "user" → 사용자 페이지, "admin" → 관리자 페이지
const ACCOUNTS = [
  { id: "USER1", password: "1234", role: "user" },
  { id: "USER2", password: "1234", role: "user" },
  { id: "USER3", password: "1234", role: "user" },
  { id: "USER4", password: "1234", role: "user" },
  { id: "ADMIN", password: "1234", role: "admin" },
];

// 나중에 실제 계좌번호로 바꾸면 됩니다.
const ACCOUNT_NUMBER = "";

// 여러 폰이 같은 참가자/게임 상태를 보게 하는 공유 저장소입니다.
const SYNC_URL = "https://kvdb.io/Tz221H6wkuGCFTuDvTkmL2/state";
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
  { id: "game2", label: "게임 2" },
  { id: "game3", label: "게임 3" },
  { id: "game4", label: "게임 4" },
];
