export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { addPracticeAccount } = await import("./lib/demo-auth.mjs");
    await addPracticeAccount("practice01", "Practice2026!");
  }
}
