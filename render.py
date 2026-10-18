"""Make the TV images from board.html.  Run after changing board.html:  python3 render.py

pgm.jpg            platinum / palladium / rhodium page (prices baked in)
silver-blank.jpg   silver page without the numbers
silver-layout.json where and how index.html draws the silver numbers (the shop types the 99.99% price)"""
import json, pathlib
from playwright.sync_api import sync_playwright

here = pathlib.Path(__file__).resolve().parent
url = (here / "board.html").as_uri() + "?render=1"

COLLECT = r"""() => {
  const lines = [];
  document.querySelectorAll('#pageSilver [data-line]').forEach(line => {
    const pieces = []; let prevRight = null;
    [...line.children].forEach(el => {
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      pieces.push({
        value: el.dataset.v || null,
        text: el.dataset.v ? null : el.textContent,
        font: cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily,
        color: cs.color,
        cy: Math.round((r.top + r.height / 2) * 10) / 10,
        gap: prevRight === null ? 0 : Math.round((r.left - prevRight) * 10) / 10
      });
      prevRight = r.right;
    });
    const lr = line.getBoundingClientRect();
    const first = line.children[0].getBoundingClientRect();
    const last = line.children[line.children.length - 1].getBoundingClientRect();
    const box = line.closest(".grade, .body"), br = box.getBoundingClientRect(), bs = getComputedStyle(box);
    const limit = line.dataset.line === "right" ? br.left + parseFloat(bs.paddingLeft) : br.right - parseFloat(bs.paddingRight);
    lines.push({ align: line.dataset.line, x: line.dataset.line === "right" ? last.right : first.left, limit, pieces });
  });
  return lines;
}"""

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1920, "height": 1080}, device_scale_factor=1)
    page.emulate_media(reduced_motion="reduce")
    page.goto(url)
    page.wait_for_timeout(2500)
    page.screenshot(path=str(here / "pgm.jpg"), type="jpeg", quality=92)
    page.keyboard.press("ArrowRight")
    page.wait_for_timeout(1500)
    page.screenshot(path=str(here / "silver-preview.jpg"), type="jpeg", quality=80)
    layout = page.evaluate(COLLECT)
    page.evaluate("document.documentElement.classList.add('render-blank')")
    page.wait_for_timeout(300)
    page.screenshot(path=str(here / "silver-blank.jpg"), type="jpeg", quality=92)
    browser.close()

(here / "silver-layout.json").write_text(json.dumps({"lines": layout}, ensure_ascii=False, indent=1), encoding="utf-8")
print("rendered pgm.jpg, silver-blank.jpg, silver-layout.json")
