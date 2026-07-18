import { getAutoScanSettings, markAutoScanRan, getTrashPurgeSettings, markTrashPurgeRan } from "./settings";
import { runAllScans, type ScanSummary } from "./scan-jobs";
import { purgeOldTrash } from "./trash-purge";

// How often to check whether a scan is due. Deliberately much shorter than
// any configurable scan interval — checking elapsed time since the last run
// (rather than a single setInterval sized to the interval itself) means a
// container restart can't reset the countdown and delay a scan indefinitely.
const TICK_MS = 10 * 60 * 1000;

// Next.js can call instrumentation's register() more than once per process
// (e.g. dev server reloads); guard on the module-level scope, which survives
// those reloads within the same process, so only one interval ever runs.
let started = false;
let running = false;

async function tick() {
  if (running) return; // previous run still in progress (unlikely at a 10min cadence, but don't overlap)
  const settings = await getAutoScanSettings();
  if (!settings.autoScanEnabled) return;

  const dueAt = settings.lastAutoScanAt
    ? settings.lastAutoScanAt.getTime() + settings.autoScanIntervalHours * 60 * 60 * 1000
    : 0; // never run before — due immediately
  if (Date.now() < dueAt) return;

  running = true;
  console.log("[scheduler] running background scan…");
  // runAllScans catches its own per-step errors and always returns a summary;
  // this outer catch is a last-resort fallback for anything that slips
  // through (e.g. a DB connectivity issue hit before any step even starts).
  let summary: ScanSummary = { faviconsFound: 0, coversFound: 0, linksChecked: 0, brokenLinksFound: 0, errors: [] };
  try {
    summary = await runAllScans();
    console.log("[scheduler] background scan complete", summary);
  } catch (err) {
    console.error("[scheduler] background scan failed:", err);
    summary.errors.push(err instanceof Error ? err.message : String(err));
  } finally {
    await markAutoScanRan(summary);
    running = false;
  }
}

// Unlike the scan above (rate-limited external HTTP calls, so it only runs
// once per configurable interval), a trash purge is just one local DELETE —
// cheap enough to just check on every tick rather than tracking its own due
// date, so trash never sits around for hours past its retention window.
async function purgeTrashTick() {
  const settings = await getTrashPurgeSettings();
  if (!settings.trashAutoPurgeEnabled) return;
  const count = await purgeOldTrash(settings.trashRetentionDays);
  if (count > 0) console.log(`[scheduler] purged ${count} trashed bookmark(s) older than ${settings.trashRetentionDays} days`);
  await markTrashPurgeRan(count);
}

export function startScheduler() {
  if (started) return;
  started = true;
  setInterval(() => {
    tick().catch((err) => console.error("[scheduler] tick failed:", err));
    purgeTrashTick().catch((err) => console.error("[scheduler] trash purge tick failed:", err));
  }, TICK_MS);
  // Also check shortly after startup rather than waiting a full tick interval.
  setTimeout(() => {
    tick().catch((err) => console.error("[scheduler] initial tick failed:", err));
    purgeTrashTick().catch((err) => console.error("[scheduler] initial trash purge tick failed:", err));
  }, 30_000);
}
