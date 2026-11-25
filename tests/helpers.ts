// Chart.js resizes its canvas from a ResizeObserver. The browser reports "ResizeObserver loop" as an uncaught
// error whenever a resize triggers another one in the same frame, and Mocha counts that as a failure.
// Delivering the callbacks in the next animation frame avoids the loop without changing what they do.
const NativeResizeObserver = window.ResizeObserver
window.ResizeObserver = class extends NativeResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    super((entries, observer) => { requestAnimationFrame(() => callback(entries, observer)) })
  }
}

export const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

export async function waitFor<T>(condition: () => T | Promise<T>, what: string, ms = 15000): Promise<T> {
  const end = performance.now() + ms
  while (performance.now() < end) {
    try {
      const value = await condition()
      if (value) return value
    } catch {}
    await wait(40)
  }
  throw new Error("timed out waiting for " + what)
}

export const block = (widget: Element) =>
  widget.querySelector(':scope > script[type="application/json"][slot="data"]') as HTMLScriptElement | null

export const saved = (widget: Element) => JSON.parse(block(widget)!.textContent!)

export function mount(html: string, { edit = false } = {}) {
  const host = document.createElement("div")
  host.className = "test-host"
  document.body.append(host)
  host.innerHTML = html
  document.designMode = edit ? "on" : "off"
  const widget = host.querySelector("webwriter-chart") as any
  if (edit) widget.setAttribute("contenteditable", "")
  return widget
}

export function unmountAll() {
  document.querySelectorAll(".test-host").forEach(host => host.remove())
  document.designMode = "off"
}
