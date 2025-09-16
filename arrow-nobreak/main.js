const { Plugin } = require("obsidian");
const view = require("@codemirror/view");
const state = require("@codemirror/state");

function arrowNoBreakPlugin() {
  return view.ViewPlugin.fromClass(class {
    constructor(viewInst) {
      this.decorations = this.build(viewInst);
    }

    update(u) {
      if (u.docChanged || u.viewportChanged) {
        this.decorations = this.build(u.view);
      }
    }

    build(viewInst) {
      const builder = new state.RangeSetBuilder();
      for (const { from, to } of viewInst.visibleRanges) {
        const text = viewInst.state.doc.sliceString(from, to);
        let idx = text.indexOf("->");
        while (idx !== -1) {
          const start = from + idx;
          const end = start + 2;
          builder.add(start, end, view.Decoration.mark({ class: "cm-arrow-nobreak" }));
          idx = text.indexOf("->", idx + 2);
        }
      }
      return builder.finish();
    }
  }, {
    decorations: v => v.decorations
  });
}

module.exports = class ArrowNoBreakPlugin extends Plugin {
  async onload() {
    this.registerEditorExtension(arrowNoBreakPlugin());
  }
};
