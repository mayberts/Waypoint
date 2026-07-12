export async function register() {
  // instrumentation.ts also loads for the Edge runtime, which can't run
  // long-lived timers or reach Postgres the way the scheduler needs to.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startScheduler } = await import("./lib/scheduler");
    startScheduler();
  }
}
