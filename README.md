# LH หลอมทอง price board

TV page: https://goldsilver00.github.io/price/

- board.html: board design and prices (edit the CONFIG object)
- render.py: run `python3 render.py` after editing board.html; makes pgm.jpg, silver-blank.jpg, silver-layout.json
- index.html: what the TV opens; shows the images full screen, rotates pages, draws the clock and the silver prices
- silver price: the shop types the 99.99% price per kg; the TV reads it from the Google Sheet in sheet-url.txt (or silver.json if no sheet is set) and works out the other grades (x percent, rounded to 50 baht)

Mobile page (for customers): https://goldsilver00.github.io/price/m/

- m/index.html: one scrolling page with the gold bar buy price, Pt/Pd/Rh and silver
- gold bar: read live in the browser from api.chnwt.dev/thai-gold-api (a mirror of สมาคมค้าทองคำ; goldtraders.or.th itself blocks other websites and GitHub). gold.py + .github/workflows/gold-price.yml keep a copy in gold.json every 5 min (08:00-18:00) as a fallback
- Pt/Pd/Rh: prices.json, written by update.py each morning (same numbers as the TV)
- silver: the same Google Sheet as the TV
