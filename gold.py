"""Fetch the latest gold-bar (96.5%) price announced by the Gold Traders Association (สมาคมค้าทองคำ)
and save it to gold.json for the mobile price page. Exit 1 if it could not be read.

goldtraders.or.th blocks GitHub's servers (Cloudflare "Just a moment..." page), so the price is
read from api.chnwt.dev/thai-gold-api, a public mirror of the association's announcement."""
import json, pathlib, re, sys, requests

HERE = pathlib.Path(__file__).resolve().parent
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept": "application/json"}
num = lambda s: float(str(s).replace(",", ""))


def from_gta():
    d = requests.get("https://www.goldtraders.or.th/api/GoldPrices/Latest?readjson=false", headers=UA, timeout=20).json()
    t = d["asTime"]  # 2026-10-23T16:42:00
    return {"barBuy": float(d["bL_BuyPrice"]), "barSell": float(d["bL_SellPrice"]), "seq": d.get("seq"),
            "date": f"{int(t[8:10])}/{int(t[5:7])}/{int(t[:4]) + 543}", "time": t[11:16], "source": "goldtraders.or.th"}


def from_mirror():
    d = requests.get("https://api.chnwt.dev/thai-gold-api/latest", headers=UA, timeout=20).json()["response"]
    seq = re.search(r"ครั้งที่\s*(\d+)", d["update_time"])
    tm = re.search(r"(\d{1,2}:\d{2})", d["update_time"])
    dd, mm, yy = d["update_date"].split("/")
    return {"barBuy": num(d["price"]["gold_bar"]["buy"]), "barSell": num(d["price"]["gold_bar"]["sell"]),
            "seq": int(seq.group(1)) if seq else None, "date": f"{int(dd)}/{int(mm)}/{yy}",
            "time": tm.group(1) if tm else "", "source": "api.chnwt.dev (สมาคมค้าทองคำ)"}


def main():
    out, errors = None, []
    for f in (from_gta, from_mirror, from_mirror):
        try:
            out = f(); break
        except Exception as e:
            errors.append(f"{f.__name__}: {e}")
    if not out:
        print("ERROR: cannot read gold price:", errors); return 1
    if not (10000 < out["barBuy"] < 500000 and out["barBuy"] <= out["barSell"]):
        print("ERROR: gold price looks wrong:", out); return 1
    f = HERE / "gold.json"
    old = json.loads(f.read_text(encoding="utf-8")) if f.exists() else {}
    if {k: old.get(k) for k in out if k != "source"} == {k: v for k, v in out.items() if k != "source"}:
        print("no change:", out); return 0
    f.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print("gold.json updated:", out, errors)
    return 0


if __name__ == "__main__":
    sys.exit(main())
