function partFiles(folder, base, extra) {
  const files = [`../making_game/${folder}/${base}.png`];
  for (let index = 1; index <= extra; index += 1) {
    files.push(`../making_game/${folder}/${base}_${String(index).padStart(2, "0")}.png`);
  }
  return files;
}

const SLOT_SETS = [
  { id: "F", label: "얼굴형 고르기", files: partFiles("Face/F", "KakaoTalk_20260913_143458666", 5) },
  { id: "E", label: "눈 고르기", files: partFiles("Face/E", "KakaoTalk_20260913_143408818", 5) },
  { id: "N", label: "코 고르기", files: partFiles("Face/N", "KakaoTalk_20260913_143418149", 5) },
  { id: "M", label: "입 고르기", files: partFiles("Face/M", "KakaoTalk_20260913_143427393", 5) },
  { id: "hair", label: "헤어스타일 고르기", files: partFiles("hair", "KakaoTalk_20260913_143436998", 5) },
  { id: "cloth", label: "옷스타일 고르기", files: partFiles("cloth", "KakaoTalk_20260913_143446901", 4) },
];

const RESULT_LAYERS = ["F", "cloth", "E", "N", "M", "hair"];
