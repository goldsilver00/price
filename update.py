"""Daily price update for the LH หลอมทอง TV board (runs on GitHub Actions).

Fetches platinum / palladium / rhodium bid prices from Kitco and the USD/THB rate,
writes them into the CONFIG of board.html, and re-renders the TV images (render.py).
Silver is typed by the shop in the Google Sheet and is not touched here.

Usage:  python update.py            normal run (skips if board already shows today's date)
        python update.py --force    update even if today's date is already on the board
        python update.py --dry-run  fetch and calculate, print the result, change nothing
        python update.py --json     only rewrite prices.json (for the mobile page) from board.html
Exit code 1 = something looked wrong; the board is left as it was.
"""
import datetime as dt
import json
import math
import pathlib
import re
import subprocess
import sys

import requests

HERE = pathlib.Path(__file__).resolve().parent
BOARD = HERE / "board.html"
OZ = 31.1035
MAX_MOVE = 0.15  # refuse to publish if a displayed price moves more than 15% in one day
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9"}
TH_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]


def log(*a):
    print(*a, flush=True)


def get(url):
    last = None
    for _ in range(3):
        try:
            r = requests.get(url, headers=UA, timeout=30)
            if r.status_code == 200 and len(r.text) > 500:
                return r.text
            last = f"HTTP {r.status_code}"
        except Exception as e:  # network hiccup: try again
            last = str(e)
    raise RuntimeError(f"cannot load {url}: {last}")


def page_text(html):
    import html as h
    t = re.sub(r"(?s)<(script|style)[^>]*>.*?</\1>", " ", html)
    return re.sub(r"\s+", " ", h.unescape(re.sub(r"<[^>]+>", " ", t)))


def num(s):
    return float(s.replace(",", ""))


# ---------- Kitco ----------
def kitco_pt_pd():
    """Bid per troy ounce (USD) for platinum and palladium, plus the quote time."""
    html = get("https://www.kitco.com/price/precious-metals")
    out = {}
    for key in ("platinum", "palladium"):
        m = re.search(r'"%s":\{[^{}]*?"results":\[\{([^{}]*)\}' % key, html)
        if m:
            fields = m.group(1)
            bid = re.search(r'"bid":([\d.]+)', fields)
            when = re.search(r'"originalTime":"([^"]+)"', fields)
            if bid:
                out[key] = (float(bid.group(1)), when.group(1) if when else "?")
                continue
        # fallback: the visible New York table "PLATINUM Oct 18, 2026 22:49 1,648.00 1,658.00"
        txt = page_text(html)
        m = re.search(r"%s ([A-Z][a-z]{2} \d{1,2}, \d{4}) (\d{1,2}:\d{2}) ([\d,]+\.\d+) ([\d,]+\.\d+)" % key.upper(), txt)
        if not m:
            raise RuntimeError(f"Kitco: {key} price not found on the page")
        out[key] = (num(m.group(3)), f"{m.group(1)} {m.group(2)} NY")
    return out


def kitco_rh():
    """Rhodium bid per gram (USD)."""
    txt = page_text(get("https://www.kitco.com/charts/rhodium"))
    m = re.search(r"Rhodium price per gram \$([\d,]+\.\d+)", txt) or re.search(r" gram ([\d,]+\.\d+)", txt)
    if not m:
        raise RuntimeError("Kitco: rhodium price per gram not found on the page")
    when = re.search(r"Live Rhodium Price ([A-Z][a-z]{2} \d{1,2}, \d{4} - \d{1,2}:\d{2}) NY", txt)
    return num(m.group(1)), (when.group(1) + " NY") if when else "?"


# ---------- USD/THB ----------
def usd_thb():
    try:
        d = json.loads(get("https://open.er-api.com/v6/latest/USD"))
        return round(float(d["rates"]["THB"]), 2), "open.er-api.com " + d.get("time_last_update_utc", "")
    except Exception as e:
        log("open.er-api failed:", e)
    d = json.loads(get("https://api.frankfurter.app/latest?from=USD&to=THB"))
    return round(float(d["rates"]["THB"]), 2), "frankfurter.app (ECB) " + d.get("date", "")


# ---------- board.html CONFIG ----------
def read_config(s):
    fx = float(re.search(r"\n  fx: ([\d.]+),", s).group(1))
    disc = float(re.search(r"\n  discount: ([\d.]+),", s).group(1))
    metals = {}
    for key, th in (("platinum", "แพลตินัม"), ("palladium", "แพลเลเดียม"), ("rhodium", "โรเดียม")):
        line = re.search(r'\{ th:"%s",[^\n]*\}' % th, s).group(0)
        usd = re.search(r"usdPerGram:([\d.]+)", line)
        thb = re.search(r"thbPerGram:([\d.]+)", line)
        d = re.search(r"discount:([\d.]+)", line)
        metals[key] = {"line": line, "usdPerGram": float(usd.group(1)) if usd else None,
                       "thbPerGram": float(thb.group(1)) if thb else None,
                       "discount": float(d.group(1)) if d else disc}
    return fx, metals


def shown(usd_per_gram, fx, discount, thb_per_gram=None):
    base = thb_per_gram if thb_per_gram is not None else usd_per_gram * fx
    half_up = lambda x: math.floor(x + 0.5)  # JavaScript Math.round
    return half_up(half_up(base * (1 - discount) * 100) / 100)  # same rounding as the page


def write_prices_json(s):
    """prices.json = the exact per-gram prices shown on the TV board, for the mobile page."""
    fx, metals = read_config(s)
    as_of = re.search(r'asOf: "([^"]*)"', s).group(1)
    names = {"platinum": ("แพลตินัม", "Platinum", "Pt"), "palladium": ("แพลเลเดียม", "Palladium", "Pd"),
             "rhodium": ("โรเดียม", "Rhodium", "Rh")}
    out = {"asOf": as_of, "metals": [
        {"key": k, "th": names[k][0], "en": names[k][1], "sym": names[k][2],
         "pricePerGram": shown(m["usdPerGram"], fx, m["discount"], m["thbPerGram"])} for k, m in metals.items()]}
    (HERE / "prices.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return out


def thai_date(d):
    return f"{d.day} {TH_MONTHS[d.month - 1]} {d.year + 543}"


def main():
    force = "--force" in sys.argv
    dry = "--dry-run" in sys.argv
    if "--json" in sys.argv:
        log(write_prices_json(BOARD.read_text(encoding="utf-8")))
        return 0
    today = dt.datetime.now(dt.timezone(dt.timedelta(hours=7))).date()
    s = BOARD.read_text(encoding="utf-8")
    as_of = thai_date(today)
    current_as_of = re.search(r'asOf: "([^"]*)"', s).group(1)
    if current_as_of == as_of and not force and not dry:
        log(f"Board already shows {as_of}; nothing to do.")
        return 0

    old_fx, metals = read_config(s)
    ptpd = kitco_pt_pd()
    rh, rh_time = kitco_rh()
    fx, fx_src = usd_thb()

    new_usd = {"platinum": round(ptpd["platinum"][0] / OZ, 4),
               "palladium": round(ptpd["palladium"][0] / OZ, 4),
               "rhodium": rh}
    log(f"Kitco platinum bid ${ptpd['platinum'][0]}/oz ({ptpd['platinum'][1]})")
    log(f"Kitco palladium bid ${ptpd['palladium'][0]}/oz ({ptpd['palladium'][1]})")
    log(f"Kitco rhodium bid ${rh}/g ({rh_time})")
    log(f"USD/THB {fx} from {fx_src}")

    problems = []
    if not (25 <= fx <= 45):
        problems.append(f"USD/THB {fx} looks wrong")
    summary = {}
    for key, m in metals.items():
        before = shown(m["usdPerGram"], old_fx, m["discount"], m["thbPerGram"])
        after = shown(new_usd[key], fx, m["discount"])
        summary[key] = (before, after)
        move = abs(after - before) / before if before else 1
        log(f"{key}: {before} -> {after} baht/g ({move:+.1%} change, {m['discount']:.0%} off)")
        if not math.isfinite(after) or after <= 0 or move > MAX_MOVE:
            problems.append(f"{key} would change from {before} to {after} baht/g")
    if problems:
        log("NOT UPDATED: " + "; ".join(problems))
        return 1
    if dry:
        log("Dry run: board.html not changed.")
        return 0

    for key, m in metals.items():
        line = m["line"]
        new_line = re.sub(r"thbPerGram:[\d.]+", f"usdPerGram:{new_usd[key]}", line)
        new_line = re.sub(r"usdPerGram:[\d.]+", f"usdPerGram:{new_usd[key]}", new_line)
        s = s.replace(line, new_line, 1)
    s = re.sub(r'asOf: "[^"]*"', f'asOf: "{as_of}"', s, count=1)
    s = re.sub(r"\n  fx: [\d.]+,", f"\n  fx: {fx:.2f},", s, count=1)
    BOARD.write_text(s, encoding="utf-8")

    subprocess.run([sys.executable, str(HERE / "render.py")], check=True)
    write_prices_json(s)
    (HERE / "last-update.txt").write_text(
        f"{as_of}  fx {fx:.2f} ({fx_src})\n"
        + "".join(f"{k}: {a} baht/g\n" for k, (_, a) in summary.items()), encoding="utf-8")
    log("Updated board.html and images for", as_of)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        log("ERROR:", e)
        sys.exit(1)
