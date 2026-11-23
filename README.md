# Taaffeite Origin: storefront design files

A static copy of the live storefront (the public website), taken from the real app. It looks and
responds exactly like the site today, at every screen size and in light and dark mode.

## Opening it

Double-click `index.html` (home page) or `pages.html` (a list of every page). No install or
server is needed. You do need an internet connection, because the fonts come from Google Fonts and
the product photos are hosted online.

## What's in the folder

| File | What it is |
| --- | --- |
| `*.html` | One file per page. Each has the full header, page content and footer. |
| `styles.css` | **All of the site's styling.** This is the real CSS, in the order the site loads it. |
| `site.js` | Small script that makes the menu, cart drawer, dark mode and scroll fade-ins work. |
| `assets/` | Local images (hero images and favicon). |
| `pages.html` | Index of every page. |

### Pages

Home, Buy now, Auctions, two product pages (buy now and auction), Private collection (the
application form and the member catalogue), Miner's Path (journal) and an article, Contact,
Sign in, the Account area (overview, orders, bids, activity, profile, cart), Checkout, Track order
(empty and with a result), Privacy, Terms and the 404 page.

The pages show a signed-in customer with one stone in the cart, so the account, cart and checkout
screens have real content. The sign-in page and the Private collection application show the
signed-out view.

## What works and what doesn't

- **Working:** links between pages, the mobile menu (narrow the window and press *Menu*), the
  cart drawer (*Cart* in the header), the Dark/Light switch, the sticky header, scroll fade-ins and
  the account tabs.
- **For show only:** forms, filters, sorting, the currency picker, quantity buttons and image
  galleries. These run on the app's code, which isn't included here. Their markup and styles are
  all present, so they can still be restyled.
- Every product card opens the same sample product page (one for buy now, one for auctions).

## Making changes

- **Styling:** edit `styles.css`. It is split into sections headed `/* ==== src/<file>.css ==== */`,
  which match the source files in the app, so please keep those headers. Colours, fonts and spacing
  are the `--sf-*` CSS variables at the start of the `src/Storefront.css` section. Dark mode is
  driven by `[data-theme="dark"]` rules.
- **Markup:** you can edit any page's HTML, but the header and footer are repeated in every
  file, so a change to them needs to go in each page (or just change one page and tell us).
  Class names connect the markup to the app's code, so keep existing ones where you can and add
  new ones freely.
- **New images:** put them in `assets/` and reference them as `assets/<name>`.

When you're done, send back the whole folder, plus a short note on what changed and which pages
to look at.
