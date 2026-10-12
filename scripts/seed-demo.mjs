import { addPracticeAccount } from "../lib/demo-auth.mjs";

const created = await addPracticeAccount("practice01", "Practice2026!");
console.log(created ? "연습용 계정을 추가했습니다: practice01" : "practice01 계정이 이미 있어 그대로 유지했습니다.");
