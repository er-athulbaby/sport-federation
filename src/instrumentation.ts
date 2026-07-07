export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { checkPassportExpiries } = await import("./lib/notifications");
  const DAY_MS = 24 * 60 * 60 * 1000;

  const runCheck = async () => {
    try {
      const result = await checkPassportExpiries();
      console.log(`[passport-expiry-check] created ${result.created} notification(s)`);
    } catch (err) {
      console.error("[passport-expiry-check] failed:", err);
    }
  };

  runCheck();
  setInterval(runCheck, DAY_MS);
}
