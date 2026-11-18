/// <reference types="mocha" />
import "mocha/mocha.js"
import { assert } from "chai"
import { getMochaConfig } from "@webwriter/build/test"
import { signal } from "@webwriter/lit"
import { WebwriterChart } from "../src/widgets/webwriter-chart"
import rainCsv from "./fixtures/rain.csv"
import noRowsCsv from "./fixtures/no-rows.csv"
import snippet from "../snippets/scatterplot-exercise.html"
import barSnippet from "../snippets/bar+line-chart.html"
import { themedPalette } from "../src/components/theme"
import { block, mount, saved, unmountAll, waitFor } from "./helpers"

mocha.setup(getMochaConfig())

const scatterOf = (widget: any) => widget.shadowRoot.querySelector("scatter-chart-js")

async function ready(widget: any) {
  await widget.updateComplete
  widget.handleTabShow(new CustomEvent("sl-tab-show", { detail: { name: "viz-scatterplot-fixed" } }))
  await waitFor(() => scatterOf(widget)?._chart, "the scatter plot")
  await widget.updateComplete
  return scatterOf(widget)
}

const key = (name: string) => new KeyboardEvent("keydown", { key: name, bubbles: true, composed: true, cancelable: true })

describe("<webwriter-chart>", function () {
  this.timeout(30000)
  afterEach(unmountAll)

  for (const mode of ["read", "edit"]) {
    const edit = mode === "edit"
    describe(`${mode} mode`, function () {
      let widget: any, scatter: any
      beforeEach(async function () {
        widget = mount(snippet, { edit })
        scatter = await ready(widget)
      })

      it("renders the scatter plot from the data block", function () {
        assert.equal(widget.sharedState.chart.title, "My fancy Chart")
      })

      it("passes permissions to the components in the shadow tree", function () {
        assert.equal(scatter.editing, edit)
        assert.notProperty(saved(widget), "editable")
      })

      it("writes a state change to the data block once", async function () {
        const keysBefore = Object.keys(saved(widget)).sort().join()
        widget.sharedState = { ...widget.sharedState, regressionType: "none" }
        await waitFor(() => saved(widget).regressionType === "none", "the write")
        assert.lengthOf(widget.querySelectorAll('script[slot="data"]'), 1)
        assert.notProperty(saved(widget).chart, "optionDefinition")
        assert.equal(saved(widget).chart.title, "My fancy Chart")
        assert.equal(Object.keys(saved(widget)).sort().join(), keysBefore)
      })

      it("takes over a change of the data block from outside", async function () {
        const data = saved(widget)
        data.chart.title = "Von aussen"
        block(widget)!.textContent = JSON.stringify(data)
        await waitFor(() => widget.sharedState.chart.title === "Von aussen", "the outside change")
      })

      it("removes the selection with the Delete key while the plot has the focus", async function () {
        const count = () => scatter._getWorkingSets().length
        const before = count()
        assert.isAbove(before, 1)
        scatter._sel.add(0); scatter._selCount = 1
        scatter.focus()
        const event = key("Delete")
        scatter.dispatchEvent(event)
        assert.isTrue(event.defaultPrevented, "the key was not handled")
        await waitFor(() => count() === before - 1, "the point to be removed")
      })

      it("leaves the key to the page without a selection", function () {
        scatter._sel.clear(); scatter._selCount = 0
        const before = scatter._getWorkingSets().length
        const event = key("Backspace")
        scatter.dispatchEvent(event)
        assert.isFalse(event.defaultPrevented, "Backspace was swallowed")
        assert.lengthOf(scatter._getWorkingSets(), before)
      })

      it("does not delete a selection from another control", function () {
        scatter._sel.add(0); scatter._selCount = 1
        widget.focus()
        assert.isTrue(document.activeElement === widget && !scatter.matches(":focus-within"), "the focus did not leave the plot")
        const before = scatter._getWorkingSets().length
        const event = key("Delete")
        widget.dispatchEvent(event)
        assert.isFalse(event.defaultPrevented, "Delete was handled outside the plot")
        assert.lengthOf(scatter._getWorkingSets(), before)
        scatter._sel.clear(); scatter._selCount = 0
      })

      it("moves between points, selects and clears with the keyboard", async function () {
        const canvas = scatter.shadowRoot.querySelector("#chart-canvas") as HTMLCanvasElement
        assert.equal(canvas.tabIndex, 0, "the canvas is not a tab stop")
        assert.isString(canvas.getAttribute("aria-label"))
        canvas.focus()
        const press = (name: string, shift = false) => {
          const event = new KeyboardEvent("keydown", { key: name, shiftKey: shift, bubbles: true, composed: true, cancelable: true })
          canvas.dispatchEvent(event)
          return event
        }
        assert.isTrue(press("ArrowRight").defaultPrevented)
        const first = scatter._kbIdx
        assert.isNumber(first, "the cursor did not start")
        assert.include(scatter._announcement, "Point")
        press("ArrowRight"); press("ArrowUp")
        assert.isNumber(scatter._kbIdx)
        assert.isTrue(press("Enter").defaultPrevented)
        assert.isTrue(scatter._sel.has(scatter._kbIdx), "Enter did not select")
        assert.equal(scatter._selCount, 1)
        press(" ")
        assert.equal(scatter._selCount, 0, "Space did not deselect")
        assert.isFalse(press("Escape").defaultPrevented, "Escape without a selection was swallowed")
        scatter._sel.add(scatter._kbIdx); scatter._selCount = 1
        const at = () => Number(scatter._getWorkingSets()[scatter._kbIdx].data[scatter.xAxisIndex])
        const before = at()
        assert.isTrue(press("ArrowRight", true).defaultPrevented)
        assert.notEqual(at(), before, "Shift+ArrowRight did not move the point")
        assert.isTrue(scatter._hasPendingChanges)
        assert.isTrue(press("Escape").defaultPrevented)
        assert.equal(scatter._selCount, 0)
      })

      it("drags a selected point with a touch", async function () {
        const canvas = scatter.shadowRoot.querySelector("#chart-canvas") as HTMLCanvasElement
        const chart = scatter._chart
        const index = 0
        const xi = scatter.xAxisIndex, yi = scatter.yAxisIndex
        const set = scatter._getWorkingSets()[index]
        const startX = Number(set.data[xi])
        const rect = canvas.getBoundingClientRect()
        const at = (x: number, y: number) => new Touch({ identifier: 1, target: canvas, clientX: rect.left + x, clientY: rect.top + y })
        const px = chart.scales.x.getPixelForValue(Number(set.data[xi]))
        const py = chart.scales.y.getPixelForValue(Number(set.data[yi]))
        scatter._sel.add(index); scatter._selCount = 1
        const fire = (type: string, touch: Touch) => {
          const event = new TouchEvent(type, { touches: type === "touchend" ? [] : [touch], changedTouches: [touch], bubbles: true, cancelable: true })
          canvas.dispatchEvent(event)
          return event
        }
        assert.isTrue(fire("touchstart", at(px, py)).defaultPrevented, "the touch did not grab the selected point")
        fire("touchmove", at(px + 30, py - 30))
        fire("touchmove", at(px + 60, py - 40))
        fire("touchend", at(px + 60, py - 40))
        assert.isTrue(scatter._hasPendingChanges, "the point did not move")
        assert.isAbove(Number(scatter._getWorkingSets()[index].data[xi]), startX)
        assert.isFalse(scatter.ptr._touchDragging)
      })

      it("follows a print dialog with its panels", async function () {
        const main = widget.shadowRoot.querySelector("#main") as HTMLElement
        window.dispatchEvent(new Event("beforeprint"))
        assert.isTrue(main.classList.contains("printing"))
        window.dispatchEvent(new Event("afterprint"))
        assert.isFalse(main.classList.contains("printing"))
      })

      it("starts renaming a tab with F2", async function () {
        const tab = widget.shadowRoot.querySelector('sl-tab[panel="data"]') as HTMLElement
        tab.dispatchEvent(new KeyboardEvent("keydown", { key: "F2", bubbles: true, composed: true, cancelable: true }))
        assert.equal(widget.editingVisualizationId, "data")
        widget.cancelInlineTabRename()
      })

      it("keeps the delete action out of the drawer", function () {
        assert.isTrue(widget.actions.deleteSelection.hidden)
        assert.isString(widget.actions.configureChart.label)
      })
    })
  }

  it("follows contenteditable at runtime", async function () {
    const widget = mount(snippet)
    const scatter = await ready(widget)
    assert.isFalse(scatter.editing, "starts as reader")
    widget.setAttribute("contenteditable", "")
    await waitFor(() => scatter.editing === true, "edit mode")
    widget.removeAttribute("contenteditable")
    await waitFor(() => scatter.editing === false, "read mode again")
  })

  it("applies the defaults without a block and creates one with slot=data on the first change", async function () {
    const widget = mount("<webwriter-chart></webwriter-chart>", { edit: true })
    await widget.updateComplete
    assert.equal(widget.sharedState.chart.title, "My Chart")
    assert.isNull(block(widget), "a block appeared without a change")
    widget.sharedState = { ...widget.sharedState, regressionType: "linear" }
    await waitFor(() => block(widget), "the block")
    assert.equal(block(widget)!.getAttribute("slot"), "data")
    assert.equal(block(widget)!.getAttribute("type"), "application/json")
    assert.equal(saved(widget).regressionType, "linear")
  })

  describe("conversions and signals", function () {
    const empty = () => mount("<webwriter-chart></webwriter-chart>", { edit: true })
    const fragmentOf = (html: string) => document.createRange().createContextualFragment(html)
    const csvFile = (text: string, name = "data.csv") => new File([text], name, { type: "text/csv" })
    const datasets = (widget: any) => widget.sharedState.chart.datasets

    it("declares its conversions", function () {
      assert.hasAllKeys(WebwriterChart.convertFrom, ["table", ".csv", "text/csv", ".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"])
      assert.hasAllKeys(WebwriterChart.convertTo, ["table", "text/csv", "image/png"])
    })

    it("takes over a table and gives it back", async function () {
      const widget = empty()
      await widget.updateComplete
      const table = fragmentOf(`<table><caption>Weather</caption><thead><tr><th></th><th>Mon</th><th>Tue</th></tr></thead>
        <tbody><tr><th>Aachen</th><td>3</td><td>4,5</td></tr><tr><th>Köln</th><td>6</td><td></td></tr></tbody></table>`)
      assert.notEqual(WebwriterChart.convertFrom.table.call(widget, table), false)
      assert.equal(widget.sharedState.chart.title, "Weather")
      assert.deepEqual(datasets(widget).labels, ["Mon", "Tue"])
      assert.deepEqual(datasets(widget).sets.map((set: any) => [set.name, ...set.data]), [["Aachen", 3, 4.5], ["Köln", 6, 0]])
      const out = WebwriterChart.convertTo.table.call(widget) as HTMLTableElement
      assert.equal(out.tagName, "TABLE")
      assert.isNull(out.parentNode)
      assert.deepEqual(Array.from(out.rows[0].cells, (cell) => cell.textContent), ["Weather", "Mon", "Tue"])
      assert.deepEqual(Array.from(out.rows[1].cells, (cell) => cell.textContent), ["Aachen", "3", "4.5"])
      const again = empty()
      await again.updateComplete
      WebwriterChart.convertFrom.table.call(again, fragmentOf(out.outerHTML))
      assert.deepEqual(datasets(again).sets.map((set: any) => set.data), datasets(widget).sets.map((set: any) => set.data))
    })

    it("declines a table it cannot use and an empty widget", async function () {
      const widget = empty()
      await widget.updateComplete
      assert.isFalse(WebwriterChart.convertFrom.table.call(widget, fragmentOf("<table><tr><td>one</td></tr></table>")))
      assert.isFalse(WebwriterChart.convertFrom.table.call(widget, fragmentOf("<p>no table</p>")))
      assert.isNull(WebwriterChart.convertTo.table.call(widget))
    })

    it("imports a CSV file only when the apply function runs", async function () {
      const widget = empty()
      await widget.updateComplete
      const apply = await WebwriterChart.convertFrom[".csv"].call(widget, csvFile(rainCsv))
      assert.lengthOf(datasets(widget).sets, 0, "changed before apply")
      apply()
      assert.equal(widget.sharedState.chart.title, "Rain days")
      assert.deepEqual(datasets(widget).labels, ["Jan", "Feb", "March, late"])
      assert.deepEqual(datasets(widget).sets.map((set: any) => [set.name, ...set.data]), [["Aachen", 12, 9.5, 14], ['Köln "Süd"', 8, 0, 11]])
    })

    it("rejects invalid CSV with a message and leaves the widget alone", async function () {
      const widget = empty()
      await widget.updateComplete
      let error: Error | undefined
      try { await WebwriterChart.convertFrom[".csv"].call(widget, csvFile(noRowsCsv)) } catch (e) { error = e as Error }
      assert.match(error?.message ?? "", /header row/)
      assert.lengthOf(datasets(widget).sets, 0)
    })

    it("exports CSV that imports to the same data", async function () {
      const source = mount(barSnippet)
      await source.updateComplete
      const file = WebwriterChart.convertTo["text/csv"].call(source) as File
      assert.equal(file.type, "text/csv")
      assert.match(file.name, /\.csv$/)
      const target = empty()
      await target.updateComplete
      ;(await WebwriterChart.convertFrom["text/csv"].call(target, file))()
      const strip = (widget: any) => datasets(widget).sets.map((set: any) => [set.name, ...set.data])
      assert.deepEqual(strip(target), strip(source))
      assert.deepEqual(datasets(target).labels, datasets(source).labels)
      assert.equal(target.sharedState.chart.title, source.sharedState.chart.title)
    })

    it("exports a PNG of the chart on screen", async function () {
      const widget = mount(barSnippet)
      await widget.updateComplete
      const file = (await waitFor(() => WebwriterChart.convertTo["image/png"].call(widget), "the picture"))!
      assert.equal(file.type, "image/png")
      assert.isAbove(file.size, 200)
    })

    it("publishes the data as a table signal", async function () {
      const widget = mount(barSnippet)
      await widget.updateComplete
      const signal = widget.signals.table
      assert.strictEqual(widget.signals.table, signal, "the signal instance changes")
      await waitFor(() => signal.get(), "the table")
      const table = signal.get()
      assert.deepEqual(table.columns.slice(1), datasets(widget).labels)
      assert.lengthOf(table.rows, datasets(widget).sets.length)
      const sets = datasets(widget).sets.map((set: any, i: number) => i === 0 ? { ...set, name: "Changed" } : set)
      widget.sharedState = { ...widget.sharedState, chart: { ...widget.sharedState.chart, datasets: { ...datasets(widget), sets } } }
      await waitFor(() => signal.get().rows[0][0] === "Changed", "the changed table")
    })

    it("shows a connected table and returns to the saved data when the source ends", async function () {
      const widget = mount(barSnippet, { edit: true })
      await widget.updateComplete
      const savedSets = JSON.stringify(saved(widget).chart.datasets)
      const value = signal<any>({ columns: ["Run", "S", "I"], rows: [["one", 90, 10], ["two", 80, 20]] })
      const lifetime = new AbortController()
      WebwriterChart.effects["data-from"].connect.call(widget, value, lifetime.signal)
      await waitFor(() => widget.dataLinked, "the link")
      assert.deepEqual(datasets(widget).labels, ["S", "I"])
      assert.deepEqual(datasets(widget).sets.map((set: any) => set.name), ["one", "two"])
      value.set({ columns: ["Run", "S", "I"], rows: [["one", 70, 30]] })
      await waitFor(() => datasets(widget).sets.length === 1, "the new value")
      widget.sharedState = { ...widget.sharedState, regressionType: "none" }
      await waitFor(() => saved(widget).regressionType === "none", "the write")
      assert.equal(JSON.stringify(saved(widget).chart.datasets), savedSets, "linked data reached the data block")
      lifetime.abort()
      await waitFor(() => !widget.dataLinked, "the end of the link")
      assert.equal(JSON.stringify(datasets(widget)), savedSets)
    })

    it("imports an Excel file only when the apply function runs", async function () {
      const XLSX = await import("xlsx")
      const book = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([["Rain days", "Jan", "Feb"], ["Aachen", 12, 9], ["Köln", 8, 3]]), "Sheet1")
      const bytes = XLSX.write(book, { type: "array", bookType: "xlsx" })
      const type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      const file = new File([bytes], "rain.xlsx", { type })
      assert.strictEqual(WebwriterChart.convertFrom[type], WebwriterChart.convertFrom[".xlsx"])
      const widget = empty()
      await widget.updateComplete
      const apply = await WebwriterChart.convertFrom[type].call(widget, file)
      assert.lengthOf(datasets(widget).sets, 0, "changed before apply")
      apply()
      assert.deepEqual(datasets(widget).labels, ["Jan", "Feb"])
      assert.deepEqual(datasets(widget).sets.map((set: any) => [set.name, ...set.data]), [["Aachen", 12, 9], ["Köln", 8, 3]])
      let error: Error | undefined
      try { await WebwriterChart.convertFrom[".xlsx"].call(widget, new File([], "bad.xlsx")) } catch (e) { error = e as Error }
      assert.isDefined(error)
    })

    it("exports the PNG on the page background", async function () {
      const widget = mount(barSnippet)
      widget.style.backgroundColor = "rgb(20, 30, 40)"
      await widget.updateComplete
      const file = (await waitFor(() => WebwriterChart.convertTo["image/png"].call(widget), "the picture"))!
      const bitmap = await createImageBitmap(file)
      const canvas = document.createElement("canvas")
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const context = canvas.getContext("2d")!
      context.drawImage(bitmap, 0, 0)
      assert.deepEqual(Array.from(context.getImageData(1, 1, 1, 1).data), [20, 30, 40, 255])
    })

    it("connects the selected points with the L key", async function () {
      const widget = mount(snippet, { edit: true })
      const scatter: any = await ready(widget)
      const canvas = scatter.shadowRoot.querySelector("canvas")
      const key = (init: KeyboardEventInit) => canvas.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, composed: true, cancelable: true, ...init }))
      canvas.focus()
      key({ key: "ArrowRight" })
      const [first, second] = scatter._plotPoints().map((point: any) => point.index)
      scatter._sel.add(first); scatter._sel.add(second); scatter._selCount = 2
      const before = scatter._lines.length
      assert.isAtLeast(scatter._selCount, 2)
      key({ key: "l" })
      assert.equal(scatter._lines.length, before + 1)
      assert.equal(scatter._selCount, 0)
    })

    it("does not write scatter data derived from a connected table", async function () {
      const widget = mount(snippet, { edit: true })
      await ready(widget)
      const before = JSON.stringify(saved(widget).scatterDatasets)
      const value = signal<any>({ columns: ["Run", "A", "B"], rows: [["one", 1, 2], ["two", 3, 5], ["three", 4, 4]] })
      const lifetime = new AbortController()
      WebwriterChart.effects["data-from"].connect.call(widget, value, lifetime.signal)
      await waitFor(() => widget.dataLinked, "the link")
      await widget.updateComplete
      await new Promise((resolve) => setTimeout(resolve, 100))
      assert.equal(JSON.stringify(saved(widget).scatterDatasets), before)
      lifetime.abort()
    })

    it("ignores a source that is not a table", async function () {
      const widget = mount(barSnippet)
      await widget.updateComplete
      const labels = datasets(widget).labels
      const lifetime = new AbortController()
      WebwriterChart.effects["data-from"].connect.call(widget, signal(42), lifetime.signal)
      await widget.updateComplete
      assert.isFalse(widget.dataLinked)
      assert.deepEqual(datasets(widget).labels, labels)
      lifetime.abort()
    })
  })

  describe("layout and theme", function () {
    it("fits containers from 300 to 2100 px without sideways scrolling", async function () {
      const widget = mount(snippet)
      await ready(widget)
      const host = widget.parentElement as HTMLElement
      for (const width of [300, 768, 2100]) {
        host.style.width = width + "px"
        await waitFor(() => Math.round(widget.getBoundingClientRect().width) === width, `width ${width}`)
        assert.isAtMost(widget.scrollWidth, widget.clientWidth + 1, `scrolls sideways at ${width}`)
        assert.isAtLeast(widget.getBoundingClientRect().height, 320, `too low at ${width}`)
      }
    })

    it("takes text color, font and series colors from the document theme", async function () {
      const widget = mount(barSnippet)
      const wrapper = widget.parentElement as HTMLElement
      wrapper.style.cssText = "--ww-text-color: rgb(49, 93, 66); --ww-font-family: Georgia, serif; --ww-theme-accent-1: #315d42; --ww-theme-accent-2: rgb(79, 135, 94)"
      await widget.updateComplete
      assert.equal(getComputedStyle(widget).color, "rgb(49, 93, 66)")
      assert.include(getComputedStyle(widget).fontFamily, "Georgia")
      assert.equal(getComputedStyle(widget.shadowRoot.querySelector("sl-tab-group")).getPropertyValue("--indicator-color").trim(), "#315d42")
      const palette = themedPalette(widget, ["#111111", "#222222", "#333333"])
      assert.deepEqual(palette, ["#315d42", "#4f875e", "#333333"])
      const bar = await waitFor(() => widget.shadowRoot.querySelector("bar-chart")?.chartHelper?.chart, "the bar chart")
      assert.equal(bar.options.color, "#315d42")
      assert.include(bar.options.font.family, "Georgia")
    })

    it("keeps the touch targets at 24 px or more", async function () {
      const widget = mount(barSnippet)
      await widget.updateComplete
      const size = (el: Element) => { const r = el.getBoundingClientRect(); return Math.min(r.width, r.height) }
      const add = await waitFor(() => widget.shadowRoot.querySelector(".tab-add-button"), "the add button")
      assert.isAtLeast(size(add), 24, "add visualization")
      const closable = await waitFor(() => widget.shadowRoot.querySelector("sl-tab[closable]"), "a closable tab")
      await closable.updateComplete
      assert.isAtLeast(size(closable.shadowRoot.querySelector("[part=close-button]")), 24, "close tab")
      const scatter = await ready(mount(snippet))
      for (const button of scatter.shadowRoot.querySelectorAll(".btn-col sl-button")) assert.isAtLeast(size(button), 24, "plot tool")
    })

    it("keeps the chart defaults without a theme", async function () {
      const widget = mount(barSnippet)
      const bar = await waitFor(() => widget.shadowRoot.querySelector("bar-chart")?.chartHelper?.chart, "the bar chart")
      assert.notEqual(bar.options.color, "#315d42")
      assert.deepEqual(themedPalette(widget, ["#111111", "#222222"]), ["#111111", "#222222"])
    })
  })

  describe("localization", function () {
    it("switches the language by lang on the widget and on an ancestor", async function () {
      const widget = mount("<webwriter-chart></webwriter-chart>")
      await widget.updateComplete
      assert.equal(widget.msg("Close"), "Close")
      let changed = 0
      widget.addEventListener("optionschange", () => changed++)
      widget.setAttribute("lang", "de")
      await waitFor(() => widget.msg("Close") !== "Close", "German catalog")
      assert.equal(widget.actions.configureChart.label, "Diagrammeinstellungen")
      assert.isAbove(changed, 0, "no optionschange for the drawer")
      await waitFor(() => widget.sharedState.chart.title === "Mein Diagramm", "localized default title")
      assert.equal(widget.getAttribute("lang"), "de")
      widget.removeAttribute("lang")
      const host = widget.parentElement as HTMLElement
      host.setAttribute("lang", "fr")
      await waitFor(() => widget.msg("Close") !== "Close" && widget.msg("Close") !== "Schließen", "inherited French")
      assert.isFalse(widget.hasAttribute("lang"), "inherited language was written to the widget")
    })

    it("lets components in the shadow tree follow the widget", async function () {
      const widget = mount(snippet)
      const scatter = await ready(widget)
      const english = scatter.msg("Close")
      widget.setAttribute("lang", "de")
      await waitFor(() => scatter.msg("Close") !== english, "child language")
    })
  })
})

mocha.run()
