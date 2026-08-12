# Running your Lil' Loaves shop

Everything on this page you can do yourself. Nothing here needs a developer.

**Your admin address:** `https://jessnix04-bvcul.wpcomstaging.com/wp-admin`

Log in with your WordPress.com account. Bookmark it.

**One rule for everything below:** after you save a change, the website takes up to a minute to catch up. If you don't see it straight away, wait a minute and refresh the page properly (`Ctrl+Shift+R`, or `Cmd+Shift+R` on a Mac). That delay is deliberate — it keeps the site fast.

---

## Your daily jobs

### Mark something sold out

The most common thing you'll do.

**Products** → click the bake → **Inventory** tab → **Stock status: Out of stock** → **Update**.

On the website the card immediately says **Sold out** and customers can't add it. Set it back to *In stock* tomorrow morning.

### Change a price

**Products** → click the bake → change **Regular price** → **Update**.

To run a sale, also fill in **Sale price**. The website then shows the old price crossed out next to the new one, automatically.

### Add a new bake

**Products** → **Add New**.

Fill in:

| Field | What to put |
|---|---|
| Product name | What customers see, e.g. *Cinnamon Swirl* |
| Description | Two or three sentences — how you'd describe it at the counter |
| Regular price | Just the number, e.g. `21.13` |
| Product image | One square photo (see below) |
| Product categories | Tick **one**: Breads, Muffins, Cookies or Crackers |

Then **Publish**.

⚠️ **If you don't tick a category, the bake won't appear on the menu.** That's the single most common mistake. The menu is organised by category, so an uncategorised product has nowhere to go.

### Take something off the menu

Don't delete it — you'll lose its sales history. Instead: **Products** → hover the name → **Quick Edit** → **Status: Draft** → **Update**. It vanishes from the website and comes back whenever you publish it again.

---

## Photos

Photos matter more than anything else on the site.

- **Square**, roughly 1200 × 1200 pixels
- **Daylight, near a window.** No flash — it flattens everything
- Shot **from directly above**, on a plain surface
- **Fill the frame** with the bake

Upload them straight from your phone at full size. Don't shrink or edit them — the website compresses them for you automatically. A big photo can be made small; a small photo can't be rescued.

---

## The Seasonal Specials strip

The four cards on the homepage and the menu page.

**Products** → find the **star** column → click the star on any product.

Starred products appear as Seasonal Specials. Unstar to remove. That's the whole thing — star four bakes and they're your specials this week.

---

## The Lunch Box

The Lunch Box lets a customer pick one bread, one cracker and one dessert.

Open the bake → on the **General** tab, near the top, find the **Lunch Box** field → choose:

| Choose | Puts it in |
|---|---|
| Not in the Lunch Box | nowhere — it's not offered as a Lunch Box option |
| Lunch Box — Bread | the Bread column |
| Lunch Box — Cracker | the Crackers column |
| Lunch Box — Dessert | the Dessert column |

**Update**, and the bake appears (or disappears) as a Lunch Box option. This works the same way for the muffins, cookies and crackers too, even though they also have pack sizes.

To change the Lunch Box price, edit the **Lunch Box** product itself like any other.

---

## The Sampler Box

The Sampler Box lets a customer pick one bread and one cracker for their $50 box (the sweets are always included, no picking needed), plus buy extra bread or crackers alongside it if they want more.

Open the bake → on the **General** tab, near the top, find the **Sampler Box** checkboxes → tick whichever apply:

| Tick | Puts it in |
|---|---|
| Bread choice | one of the free bread picks inside the box |
| Cracker choice | one of the free cracker picks inside the box |
| Bread add-on | an extra bread customers can add on top, at its own price |
| Cracker add-on | an extra cracker customers can add on top, at its own price |

Unlike the Lunch Box, you can tick **more than one box** on the same bake. Doc's and Chief's crackers, for example, are ticked as both "Cracker choice" and "Cracker add-on" — they're the only crackers you sell, so they do both jobs: free pick, or paid extra. Leave every box unticked to keep a bake out of the Sampler Box altogether.

**Update**, and the bake appears (or disappears) from the Sampler Box right away.

To change the Sampler Box's own price, edit the **Sampler Box** product itself like any other.

⚠️ **The $50 box price and the $6 mini loaf prices were set from a design mockup, not by you.** Check them and change them if they're wrong — nothing else on the site depends on that exact number, the whole site reads prices from the product itself.

---

## Orders

**WooCommerce → Orders.**

Click an order to see what they bought, their contact details, and — for collections — **which store, date and time slot they chose**.

Change the status as you go:

| Status | Means |
|---|---|
| **Processing** | Paid, you're baking it |
| **Completed** | Collected or delivered. This emails the customer |
| **Refunded** | You've given their money back |

To refund: open the order → **Refund** → enter the amount → confirm.

---

## Discount codes

**Marketing → Coupons → Add coupon**.

Give it a code customers will type (e.g. `LOAF10`), choose **Percentage discount** or **Fixed cart discount**, and set the amount.

Worth setting under **Usage restriction**: a **minimum spend**, and under **Usage limits**, how many times it can be used in total. An expiry date is on the General tab.

---

## Delivery area and charges

**WooCommerce → Settings → Shipping** → click your delivery zone.

- **Zone regions** — the postcodes you deliver to. Add or remove them here
- **Flat rate** — what you charge for delivery. Click it to change the amount

A customer outside your postcodes is told you don't deliver there, and can still choose collection.

---

## Collection days and times

**WooCommerce → Fulfilment.**

Set which days you do collection, your opening and closing time, how long each slot is, and any dates you're closed (holidays). The website works out the actual dates from that, so you set it once and only come back for holidays.

---

## When something looks wrong

**A change hasn't appeared.** Wait a minute, then hard-refresh. The site caches for speed.

**A new bake isn't on the menu.** It almost certainly has no category ticked, or it's still a Draft.

**A photo looks blurry or squashed.** Re-upload it square and at full size.

**You get a "Welcome to Woo!" setup screen.** Click **Skip guided setup**. Your shop is already set up; that wizard can undo settings.

---

## What to leave alone

You can't break anything by editing products, prices, photos, coupons or orders. Those are yours.

Do check with your developer before:

- Installing or deleting plugins
- Changing anything under **Settings → General**, **Payments**, or **Advanced**
- Deleting products that already have orders against them

---

## Getting help

Your site runs on WordPress.com, so their support can help with logging in, billing and anything server-related — there's a **Help** link in the top bar of your dashboard.

For anything about how the website itself looks or behaves, that's your developer.
