import { getConfig, setConfig } from "./storage";

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {}
): HTMLElementTagNameMap[K] {
  return Object.assign(document.createElement(tag), props);
}

async function main() {
  const app = document.getElementById("app")!;
  const existing = await getConfig();

  const serverInput = el("input", {
    type: "url",
    placeholder: "https://waypoint.example.com",
    value: existing?.serverUrl ?? "",
  });
  const tokenInput = el("input", {
    type: "text",
    placeholder: "API token from Waypoint's Settings page",
    value: existing?.apiToken ?? "",
  });
  const saveButton = el("button", { textContent: "Save" });
  const status = el("div", { className: "status" });

  saveButton.addEventListener("click", async () => {
    await setConfig({
      serverUrl: serverInput.value.trim().replace(/\/+$/, ""),
      apiToken: tokenInput.value.trim(),
    });
    status.textContent = "Saved.";
    setTimeout(() => (status.textContent = ""), 2000);
  });

  app.append(
    el("h1", { textContent: "⚓ Waypoint" }),
    el("label", { textContent: "Server URL" }),
    serverInput,
    el("label", { textContent: "API token" }),
    tokenInput,
    saveButton,
    status
  );
}

main();
