# LH หลอมทอง price board

TV page: https://goldsilver00.github.io/price/

- board.html: board design and prices (edit the CONFIG object)
- render.py: run `python3 render.py` after editing board.html; makes pgm.jpg, silver-blank.jpg, silver-layout.json
- index.html: what the TV opens; shows the images full screen, rotates pages, draws the clock and the silver prices
- silver price: the shop types the 99.99% price per kg; the TV reads it from the Google Sheet in sheet-url.txt (or silver.json if no sheet is set) and works out the other grades (x percent, rounded to 50 baht)
