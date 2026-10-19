"""One-off probe: what does Kitco look like from a GitHub server?"""
import re, requests, html
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9"}
def show(name, url):
    try:
        r = requests.get(url, headers=UA, timeout=30)
        t = r.text
        print(f"=== {name} {url} status={r.status_code} len={len(t)}")
        txt = html.unescape(re.sub(r"<[^>]+>", " ", re.sub(r"(?s)<(script|style)[^>]*>.*?</\1>", " ", t)))
        txt = re.sub(r"\s+", " ", txt)
        for kw in ["PLATINUM", "PALLADIUM", "Platinum", "Palladium", "rhodium", "Bid", "per gram"]:
            for m in list(re.finditer(kw, txt))[:3]:
                print(f"  [{kw}] ...{txt[max(0,m.start()-80):m.start()+220]}...")
        if len(t) < 3000: print("RAW:", t[:3000])
        for kw in ['"bid"', 'bid":', 'Bid']:
            for m in list(re.finditer(re.escape(kw), t))[:4]:
                print(f"  RAW[{kw}] ...{t[max(0,m.start()-150):m.start()+200]}...")
    except Exception as e:
        print(f"=== {name} ERROR {e}")
show("pm", "https://www.kitco.com/price/precious-metals")
show("rh", "https://www.kitco.com/charts/rhodium")
show("pt-chart", "https://www.kitco.com/charts/platinum")
for s in ["PT", "PD", "RH"]:
    show("proxy-" + s, f"https://proxy.kitco.com/getPM?symbol={s}&currency=USD&unit=ounce")
show("fx-er", "https://open.er-api.com/v6/latest/USD")
show("fx-frank", "https://api.frankfurter.app/latest?from=USD&to=THB")
