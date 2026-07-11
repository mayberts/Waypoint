import { getConfig, setConfig } from "./storage";

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {}
): HTMLElementTagNameMap[K] {
  return Object.assign(document.createElement(tag), props);
}

function logoHeading(text: string): HTMLHeadingElement {
  const h1 = el("h1", { textContent: text });
  h1.prepend(el("img", { src: "icons/icon48.png", width: 20, height: 20, alt: "" }));
  return h1;
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
    logoHeading("Waypoint"),
    el("label", { textContent: "Server URL" }),
    serverInput,
    el("label", { textContent: "API token" }),
    tokenInput,
    saveButton,
    status
  );
}

main();
