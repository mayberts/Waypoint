import { getConfig } from "./storage";

interface Collection {
  id: string;
  name: string;
  parentId: string | null;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {}
): HTMLElementTagNameMap[K] {
  return Object.assign(document.createElement(tag), props);
}

function logoHeading(text: string): HTMLHeadingElement {
  const h1 = el("h1", { textContent: text });
  h1.prepend(el("img", { src: "icons/icon48.png", width: 18, height: 18, alt: "" }));
  return h1;
}

function flattenForSelect(collections: Collection[]): { id: string; label: string }[] {
  const byParent = new Map<string | null, Collection[]>();
  for (const c of collections) {
    const list = byParent.get(c.parentId) ?? [];
    list.push(c);
    byParent.set(c.parentId, list);
  }
  const out: { id: string; label: string }[] = [];
  function walk(parentId: string | null, depth: number) {
    for (const c of byParent.get(parentId) ?? []) {
      out.push({ id: c.id, label: `${"  ".repeat(depth)}${c.name}` });
      walk(c.id, depth + 1);
    }
  }
  walk(null, 0);
  return out;
}

async function main() {
  const app = document.getElementById("app")!;
  const config = await getConfig();

  if (!config) {
    app.append(
      logoHeading("Save to Waypoint"),
      el("p", { textContent: "Not configured yet." }),
      el("a", {
        href: "#",
        textContent: "Open extension options →",
        onclick: (e) => {
          e.preventDefault();
          chrome.runtime.openOptionsPage();
        },
      })
    );
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab.url ?? "";
  const title = tab.title ?? url;

  const titleInput = el("input", { type: "text", value: title });
  const urlDiv = el("div", { className: "url", textContent: url });
  const collectionSelect = el("select");
  collectionSelect.append(el("option", { value: "", textContent: "Unsorted" }));
  const tagsInput = el("input", { type: "text", placeholder: "Tags, comma separated" });
  const saveButton = el("button", { textContent: "Save bookmark" });
  const status = el("div", { className: "status" });

  app.append(
    logoHeading("Save to Waypoint"),
    urlDiv,
    titleInput,
    collectionSelect,
    tagsInput,
    saveButton,
    status
  );

  try {
    const res = await fetch(`${config.serverUrl}/api/extension/collections`, {
      headers: { Authorization: `Bearer ${config.apiToken}` },
    });
    if (res.ok) {
      const collections: Collection[] = await res.json();
      for (const c of flattenForSelect(collections)) {
        collectionSelect.append(el("option", { value: c.id, textContent: c.label }));
      }
    }
  } catch {
    // Collection list is a nice-to-have; saving to Unsorted still works if this fails.
  }

  if (!url || !/^https?:\/\//i.test(url)) {
    saveButton.disabled = true;
    status.textContent = "This page can't be saved (not an http/https URL).";
    status.className = "status error";
    return;
  }

  saveButton.addEventListener("click", async () => {
    saveButton.disabled = true;
    status.textContent = "Saving…";
    status.className = "status";
    try {
      const tags = tagsInput.value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await fetch(`${config.serverUrl}/api/extension/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiToken}` },
        body: JSON.stringify({
          url,
          title: titleInput.value || undefined,
          collectionId: collectionSelect.value || null,
          tags,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ? JSON.stringify(body.error) : res.statusText);
      }
      status.textContent = "Saved ✓";
      status.className = "status success";
      setTimeout(() => window.close(), 700);
    } catch (err) {
      status.textContent = err instanceof Error ? err.message : "Failed to save";
      status.className = "status error";
      saveButton.disabled = false;
    }
  });
}

main();
