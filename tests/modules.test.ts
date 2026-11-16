/// <reference types="mocha" />
import "mocha/mocha.js"
import { assert } from "chai"
import { getMochaConfig } from "@webwriter/build/test"
import "../src/widgets/webwriter-chart"
import snippet from "../snippets/scatterplot-exercise.html"
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
