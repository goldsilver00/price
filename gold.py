"""Fetch the latest gold-bar price announced by the Gold Traders Association (สมาคมค้าทองคำ)
and save it to gold.json for the mobile price page. Exit 1 if it could not be read."""
import json, pathlib, sys, requests

HERE = pathlib.Path(__file__).resolve().parent
URL = "https://www.goldtraders.or.th/api/GoldPrices/Latest?readjson=false"
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
           "Accept": "application/json, text/plain, */*", "Referer": "https://www.goldtraders.or.th/",
           "Accept-Language": "th-TH,th;q=0.9,en;q=0.8"}

def main():
    last = None
    for _ in range(3):
        try:
            r = requests.get(URL, headers=HEADERS, timeout=30)
            d = r.json()
            break
        except Exception as e:
            last = f"{getattr(r, 'status_code', '?')} {e} {getattr(r, 'text', '')[:200]!r}" if 'r' in locals() else str(e)
    else:
        print("ERROR: cannot read gold price:", last); return 1
    buy, sell = float(d["bL_BuyPrice"]), float(d["bL_SellPrice"])
    if not (10000 < buy < 500000 and buy <= sell):
        print("ERROR: gold price looks wrong:", d); return 1
    out = {"barBuy": buy, "barSell": sell, "seq": d.get("seq"), "asTime": d.get("asTime"),
           "changeFromPrev": d.get("priceChangeFromPrevRow"), "changeFromYesterday": d.get("priceChangeFromPrevDayLast"),
           "bahtPerUSD": d.get("bahtPerUSD"), "goldSpot": d.get("goldSpot")}
    f = HERE / "gold.json"
    old = f.read_text(encoding="utf-8") if f.exists() else ""
    new = json.dumps(out, ensure_ascii=False, indent=1)
    if old.strip() != new.strip():
        f.write_text(new + "\n", encoding="utf-8")
        print("gold.json updated:", out)
    else:
        print("no change:", out["asTime"], out["seq"])
    return 0

if __name__ == "__main__":
    sys.exit(main())
