"""Make the TV images from board.html.
Run after changing prices:  python3 render.py
Creates pgm.jpg (platinum group page) and silver.jpg (silver page), 1920x1080."""
import pathlib, re
from playwright.sync_api import sync_playwright

here = pathlib.Path(__file__).resolve().parent
src = (here / "board.html").read_text(encoding="utf-8")
show_silver = re.search(r"showSilver:\s*true", src) is not None
url = (here / "board.html").as_uri() + "?render=1"

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1920, "height": 1080}, device_scale_factor=1)
    page.emulate_media(reduced_motion="reduce")
    page.goto(url)
    page.wait_for_timeout(2500)
    page.screenshot(path=str(here / "pgm.jpg"), type="jpeg", quality=92)
    if show_silver:
        page.keyboard.press("ArrowRight")
        page.wait_for_timeout(1500)
        page.screenshot(path=str(here / "silver.jpg"), type="jpeg", quality=92)
    browser.close()
(here / "pages.txt").write_text("pgm.jpg\nsilver.jpg\n" if show_silver else "pgm.jpg\n")
print("rendered:", "pgm.jpg" + (", silver.jpg" if show_silver else ""))
