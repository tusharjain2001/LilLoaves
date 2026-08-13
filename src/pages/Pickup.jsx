import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import OrderHero from "../components/OrderHero.jsx";
import CartItemsPanel from "../components/CartItemsPanel.jsx";
import { useCart } from "../context/CartContext.jsx";
import { fetchQuote } from "../lib/quote.js";
import { fetchPickupConfig, slotValue, pickupDayCopy } from "../lib/pickup.js";
import { sendOrderNotification } from "../lib/notify.js";
import waveRose from "../assets/pickup/wave-rose.svg";
import iconLocation from "../assets/pickup/icon-location.svg";
import arrowLeft from "../assets/pickup/arrow-left.svg";
import arrowRight from "../assets/pickup/arrow-right.svg";
import iconBack from "../assets/shared/icon-back.svg";

/**
 * /pickup is a five-stage flow, not a scrolling page - Figma 500:16552 draws
 * it as five frames wired together with arrows:
 *
 *   cart     500:3081   cart items + coupon + order summary, "Proceed to Pickup"
 *   contact  500:7535   Step 01, the contact form
 *   select   500:10552  Step 02, pick up date / pick up time
 *   confirm  500:16525  "Confirm Order" -> Place Order
 *   done     500:16532  "Hurray! Order Confirmed"
 *
 * Only "cart" shows the cart; from "contact" onwards the order is fixed,
 * which is the client's requirement - a collection slot must not be chosen
 * for a basket that can still change underneath it. Everything from
 * "contact" on also carries the PICK UP FROM band.
 */
const STAGE_ORDER = ["cart", "contact", "select", "confirm", "done"];

const SELECT_TABS = [
  { key: "date", label: "Pick Up Date" },
  { key: "time", label: "Pick Up Time" },
];

// Shown for any money figure whose quote hasn't landed yet - never blank
// beside a label, never a fabricated $0.00. Same convention as Cart.jsx.
const PENDING = "—";

// Every uppercase heading on this page is Parkinsans Medium with -0.05em
// tracking in Figma (-1.2px at 24, -1.6px at 32, -1.8px at 36, -2px at 40),
// so the tracking is expressed as the one em value they all share rather
// than four hand-copied pixel values that would drift apart at other sizes.
const HEADING_CLASSES =
  "font-parkinsans font-medium uppercase tracking-[-0.05em] text-cocoa";

// The two uppercase lines Figma sets in Parkinsans *Regular* rather than
// Medium - the month header (500:12063) and the chosen date above the slots
// (500:16500). Kept as its own constant instead of appending `font-normal` to
// HEADING_CLASSES, since two font-weight utilities on one element resolve by
// stylesheet order, not by the order they're written in the class string.
const HEADING_REGULAR_CLASSES =
  "font-parkinsans uppercase tracking-[-0.05em] text-cocoa";

// The "Step 01"/"Step 02" chips. Both share every token; only the fill
// differs, because Step 01 sits on the white contact card and Step 02 sits on
// the cream page behind it.
const STEP_BADGE_CLASSES =
  "flex shrink-0 items-center justify-center whitespace-nowrap rounded-full px-[20px] py-[5px] font-parkinsans text-[13px] text-clay lg:w-[174px] lg:px-[32px] lg:py-[8px] lg:text-[16px]";

const LABEL_CLASSES = "font-parkinsans text-[13px] lg:text-[20px]";

const FIELD_CLASSES =
  "w-full rounded-[6px] border border-[#e9dccf] bg-[#fdfcf8] px-[14px] font-parkinsans text-[13px] text-cocoa outline-none focus:border-[#d8cbbe] lg:rounded-[10px] lg:px-[20px] lg:text-[20px]";

const PILL_CLASSES =
  "w-[74px] shrink-0 whitespace-nowrap rounded-[10px] px-[10px] py-[5px] font-parkinsans text-[12px] transition-colors lg:w-[119px] lg:rounded-[16px] lg:px-[16px] lg:py-[8px] lg:text-[20px]";

// Same pill look as PILL_CLASSES (identical radius/padding/font/colour
// tokens - nothing new invented), minus the fixed width: that width was
// sized in Figma for a short date like "9 Aug", and a real slot label like
// "2:00 PM - 2:30 PM" (the backend always sends a start-end range, never a
// single time) doesn't fit an 119px pill. Sized to its own content instead,
// same as the equivalent slot pills on Cart.jsx.
const SLOT_PILL_CLASSES =
  "whitespace-nowrap rounded-[10px] px-[10px] py-[5px] font-parkinsans text-[12px] transition-colors lg:rounded-[16px] lg:px-[16px] lg:py-[8px] lg:text-[20px]";

// The filled taupe pill shared by "Share Info with the Owner" (500:7563) and
// "Place Order" (500:16525) - one definition so the two cannot drift.
const FILLED_BUTTON_CLASSES =
  "cursor-pointer whitespace-nowrap rounded-full bg-taupe px-[21px] py-[6px] font-parkinsans text-[13px] text-white lg:h-[38px] lg:px-[48px] lg:py-[10px] lg:text-[16px]";

// The centred back link Figma puts above Step 02 (500:13520). Reuses the
// same 11x22 chevron OrderHero's Continue Shopping link already renders.
const BACK_LINK_CLASSES =
  "flex cursor-pointer items-center gap-[10px] font-parkinsans text-[13px] text-cocoa lg:gap-[15px] lg:text-[16px]";

const INITIAL_FORM = { name: "", email: "", phone: "" };

// Deliberately permissive - just enough to reject "not an address at all".
// The bakery gets one shot at a confirmation email, so a blank or malformed
// one has to be caught here, but this must not be the thing that turns away a
// real customer with an unusual address.
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

function Asterisk() {
  return <span className="text-[#c80000]">*</span>;
}

/* One Order Summary row. `muted` is the #acacac Figma gives the Shipping and
   Discount figures (500:6034 / 500:6037) but not Items or Subtotal. */
function SummaryRow({ label, value, muted }) {
  return (
    <div className="flex w-full items-center justify-between whitespace-nowrap">
      <p className="text-[13px] lg:text-[16px]">{label}</p>
      <p className={`text-[16px] lg:text-[20px] ${muted ? "text-[#acacac]" : "text-cocoa"}`}>
        {value}
      </p>
    </div>
  );
}

function BackLink({ label, onClick }) {
  return (
    <button type="button" onClick={onClick} className={BACK_LINK_CLASSES}>
      <img src={iconBack} alt="" className="h-[16px] w-[8px] lg:h-[22px] lg:w-[11px]" />
      {label}
    </button>
  );
}

export default function Pickup() {
  const cart = useCart();
  const [form, setForm] = useState(INITIAL_FORM);
  const [activeTab, setActiveTab] = useState("date");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [promoCode, setPromoCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  // Set by Share Info with the Owner, never by typing - so the mandatory-field
  // error can't scold a customer who hasn't finished filling the form in yet.
  const [contactAttempted, setContactAttempted] = useState(false);
  // Place Order sends the two confirmation emails and only then shows the
  // "Hurray" screen. Flipped synchronously inside the handler, before the
  // request is even built, so a second click hits a disabled button rather
  // than racing the first into a duplicate pair of emails.
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState("");
  // Which of the five frames above is on screen. See STAGE_ORDER.
  const [stage, setStage] = useState("cart");
  // null means "hasn't landed yet". Same WooCommerce > Fulfilment config
  // Cart.jsx reads, via the same lib/pickup.js module, so this page can
  // never show a date/time the cart wouldn't also offer.
  const [pickupConfig, setPickupConfig] = useState(null);
  // null means "no quote has landed yet" for the same reason as Cart.jsx -
  // per-line totals render a PENDING placeholder inside CartItemsPanel until
  // this actually resolves, never a fabricated $0.00.
  const [quote, setQuote] = useState(null);
  const hasQuoted = quote !== null;

  useEffect(() => {
    const controller = new AbortController();
    fetchPickupConfig({ signal: controller.signal }).then((config) => {
      if (controller.signal.aborted) return;
      setPickupConfig(config);
    });
    return () => controller.abort();
  }, []);

  // A string key of "id:variationId:qty" triples, not `cart.lines` itself -
  // same reasoning as Cart.jsx: syncSnapshot below calls setLines on every
  // quote landing, which would otherwise re-trigger this effect forever
  // against a rate-limited endpoint.
  const linesKey = cart.lines.map((l) => `${l.id}:${l.variationId ?? 0}:${l.qty}`).join(",");

  // Same debounced quote as Cart.jsx, fulfilment fixed to "pickup" since this
  // page never collects a delivery postcode - both the per-line and summary
  // totals must still come from the server, never be computed here, per the
  // money rule. The coupon is sent because this design has a coupon box; it
  // is the same field Cart.jsx already sends, not a new endpoint or shape.
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetchQuote({
        lines: cart.lines,
        fulfilment: "pickup",
        postcode: "",
        coupon: appliedCoupon,
        signal: controller.signal,
      }).then((result) => {
        if (controller.signal.aborted) return;
        setQuote(result);
        if (result.ok) {
          result.lines.forEach((line) =>
            cart.syncSnapshot(line.id, line.unitFormatted, line.variationId)
          );
        }
      });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linesKey, appliedCoupon]);

  // Keyed by (id, variationId), same reasoning as Cart.jsx's own map: two
  // pack sizes of one product share a parent id, so keying by bare id would
  // let the second line's total silently overwrite the first's.
  const quoteLineTotals = new Map(
    (quote?.lines ?? []).map((l) => [`${l.id}:${l.variationId ?? 0}`, l.totalFormatted]),
  );

  // ponytail: only the first configured store is ever offered - see the
  // matching comment in Cart.jsx. No Figma design for a multi-store picker,
  // and the live endpoint returns exactly one store today.
  const pickupStore = pickupConfig?.stores?.[0] ?? null;
  const pickupDates = pickupStore?.dates ?? [];
  const pickupSlots = pickupStore?.slots ?? [];
  const pickupAvailable = pickupDates.length > 0 && pickupSlots.length > 0;
  // Defaults to the first available date/slot, derived at render time (not
  // a setState-in-effect) so a real pick always wins once made.
  const effectiveDate = selectedDate ?? (pickupAvailable ? pickupDates[0].date : null);
  const effectiveSlot = selectedTime ?? (pickupAvailable ? slotValue(pickupSlots[0]) : null);
  const effectiveDateLabel = pickupDates.find((d) => d.date === effectiveDate)?.label ?? "";

  // All three contact fields are mandatory - there is no optional one.
  const contactValid =
    form.name.trim() !== "" &&
    EMAIL_PATTERN.test(form.email.trim()) &&
    form.phone.trim() !== "";

  // Same guard as Cart.jsx's Proceed to Checkout: an empty cart, an
  // un-landed quote or a quote carrying errors must not move the customer on
  // to choosing a collection slot for it.
  const proceedDisabled = cart.isEmpty || !hasQuoted || quote.errors.length > 0;

  const update = (key) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setContactAttempted(true);
    // Only a complete form advances - so reaching "select" is itself proof
    // Step 01 was satisfied, and nothing downstream has to re-check it.
    if (contactValid) setStage("select");
  };

  // Picking a slot is the one action that advances Step 02 to the confirm
  // state - not the slot that renders pre-selected by default, which would
  // otherwise skip the customer past the picker the moment they opened it.
  const chooseSlot = (value) => {
    setSelectedTime(value);
    setStage("confirm");
  };

  /**
   * Place Order is the only irreversible step on this page: it emails the
   * bakery the order and the customer their confirmation. Since the flow
   * places no WooCommerce order, those two emails are the whole record - so
   * the "Hurray" screen is shown only after the send actually succeeds. A
   * failure keeps the customer here with a way to retry, rather than telling
   * them an order landed that nobody received.
   */
  const handlePlaceOrder = async () => {
    setPlacing(true);
    setPlaceError("");

    const result = await sendOrderNotification({
      lines: cart.lines,
      contact: { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() },
      // Machine values, never display labels - ll_find_store() and
      // ll_pickup_slot_valid() on the backend validate against these.
      pickup: {
        store: pickupStore?.id ?? "",
        date: effectiveDate ?? "",
        slot: effectiveSlot ?? "",
      },
      coupon: appliedCoupon,
    });

    if (result.ok) {
      setStage("done");
      // Nothing left to price, and leaving it filled would let a back
      // navigation re-place the same basket.
      cart.clear();
      return;
    }

    setPlacing(false);
    setPlaceError(
      result.error ||
        "We couldn't send your order just now. Please check your connection and try again.",
    );
  };

  const showsPickupBand = STAGE_ORDER.indexOf(stage) >= STAGE_ORDER.indexOf("contact");

  return (
    <main className="w-full overflow-x-hidden bg-cream">
      <OrderHero mode="pickup" />

      {/* PICK UP FROM - absent from the cart frame (500:3081), present from
          the contact frame (500:7536) onwards. */}
      {showsPickupBand && (
        <section className="relative h-[220px] w-full lg:h-[253px]">
          <img src={waveRose} alt="" className="absolute inset-0 h-full w-full" />
          <div className="relative z-10 mx-auto flex h-full w-full max-w-[1440px] flex-col items-center justify-center gap-[8px] px-[16px] text-center">
            <h2 className={`${HEADING_CLASSES} text-center text-[22.8px] lg:text-[32px]`}>
              Pick up from
            </h2>
            <div className="inline-flex items-center gap-[8px] rounded-[16px] border border-[rgba(204,138,122,0.39)] bg-[#f4e7e3] p-[10px]">
              <img src={iconLocation} alt="" className="size-[24px] shrink-0 lg:size-[34px]" />
              <span className="whitespace-nowrap font-parkinsans text-[16px] text-cocoa lg:text-[28px]">
                {pickupStore ? pickupStore.name : "Unavailable"}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ===================== STAGE: CART (500:3081) =====================
          The delivery cart's own two-column layout - 857fr / 420fr with a
          16px gutter inside a 74px page margin, exactly as Cart.jsx uses -
          minus the Delivery Information form, and with Proceed to Checkout
          replaced by the centred Proceed to Pickup below. */}
      {stage === "cart" && (
        <div className="mx-auto w-full max-w-[1440px] px-[16px] pb-[48px] pt-[24px] lg:px-[74px] lg:pb-[125px] lg:pt-[126px]">
          <div className="flex flex-col gap-[16px] lg:grid lg:grid-cols-[857fr_420fr] lg:items-start lg:gap-x-[16px]">
            {/* Cart Items panel - the same shared component Cart.jsx renders,
                so the two pages cannot drift apart. */}
            <CartItemsPanel quoteLineTotals={quoteLineTotals} />

            <div className="flex flex-col gap-[16px] lg:gap-[24px]">
              {/* Coupon - above the summary here, unlike the delivery cart */}
              <div className="flex h-[75px] w-full items-center justify-center rounded-[12px] border border-[#d8cbbe] bg-[#f7f5f1] lg:h-[85px] lg:rounded-[16px]">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Enter Coupon Code"
                  aria-label="Coupon code"
                  className="h-[39px] w-[150px] rounded-l-[12px] border-y border-l border-[#e3e3e3] bg-[#fbfbf8] p-[10px] font-parkinsans text-[13px] text-clay outline-none lg:h-[44px] lg:w-[222px] lg:rounded-l-[16px] lg:text-[16px]"
                />
                <button
                  type="button"
                  onClick={() => setAppliedCoupon(promoCode)}
                  className="h-[39px] shrink-0 cursor-pointer rounded-r-[12px] bg-clay p-[10px] font-parkinsans text-[13px] font-medium text-white lg:h-[44px] lg:rounded-r-[16px] lg:text-[16px]"
                >
                  Apply Coupon
                </button>
              </div>

              {/* Order Summary. Every figure below comes from /quote - none of
                  it is arithmetic done here, per the money rule. */}
              <div className="w-full rounded-[12px] border border-[#d8cbbe] bg-[#f7f5f1] px-[20px] py-[24px] lg:rounded-[16px] lg:px-[28px] lg:py-[39px]">
                <div className="flex w-full flex-col gap-[20px] lg:gap-[28px]">
                  <div className="flex w-full flex-col gap-[16px] lg:gap-[24px]">
                    <h2 className={`${HEADING_CLASSES} w-full text-[16px] lg:text-[24px]`}>
                      Order Summary
                    </h2>
                    {!cart.isEmpty && (
                      <div className="flex w-full flex-col font-parkinsans text-cocoa">
                        <div className="flex w-full flex-col border-b border-[#d9d9d9] py-[16px]">
                          <SummaryRow label="Items" value={cart.count} />
                          <SummaryRow
                            label="Subtotal"
                            value={quote?.subtotalFormatted || PENDING}
                          />
                        </div>
                        <div className="flex w-full flex-col py-[16px]">
                          <SummaryRow
                            label="Shipping"
                            value={quote?.deliveryFormatted || PENDING}
                            muted
                          />
                          <SummaryRow
                            label="Discount"
                            value={quote?.discountFormatted || PENDING}
                            muted
                          />
                        </div>
                        <div className="h-px w-full bg-[#d9d9d9]" />
                      </div>
                    )}
                  </div>
                  {!cart.isEmpty && (
                    <div className="flex w-full items-center justify-between font-parkinsans font-medium text-cocoa">
                      <p className="text-[16px] lg:text-[20px]">Total</p>
                      <p className="text-[20px] lg:text-[24px]">
                        {quote?.totalFormatted || PENDING}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {hasQuoted && quote.errors.length > 0 && (
                <p role="alert" className="font-parkinsans text-[13px] text-[#c80000]">
                  {quote.errors.join(" ")}
                </p>
              )}
            </div>
          </div>

          <div className="mt-[32px] flex w-full justify-center lg:mt-[65px]">
            <button
              type="button"
              onClick={() => setStage("contact")}
              disabled={proceedDisabled}
              className="w-full max-w-[364px] cursor-pointer rounded-full bg-cocoa px-[10px] py-[12px] font-parkinsans text-[16px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 lg:py-[16px] lg:text-[20px]"
            >
              Proceed to Pickup
            </button>
          </div>
        </div>
      )}

      {/* ================== STAGE: CONTACT - STEP 01 (500:7546) ================== */}
      {stage === "contact" && (
        <section className="mx-auto flex w-full max-w-[1440px] flex-col items-center px-[16px] pb-[48px] pt-[24px] lg:px-[181px] lg:pb-[164px] lg:pt-[45px]">
          {/* Not in Figma - see the note on Go Back to Step 01 below. The
              45px/97px split keeps the card at exactly the 164px below the
              band that 500:7546 places it. */}
          <BackLink label="Go Back to Cart" onClick={() => setStage("cart")} />

          <form
            onSubmit={handleSubmit}
            className="mt-[24px] flex w-full flex-col items-center rounded-[10px] border border-[#d8cbbe] bg-[#fffffd] p-[16px] lg:mt-[97px] lg:rounded-[16px] lg:p-[32px]"
          >
            <div className="flex w-full flex-col items-center justify-center gap-[20px] lg:gap-[34px]">
              <span className={`${STEP_BADGE_CLASSES} bg-[#f5f5f2]`}>Step 01</span>

              <div className="flex w-full flex-col items-center justify-center gap-[12px] lg:gap-[16px]">
                <h2 className={`${HEADING_CLASSES} w-full text-center text-[16px] lg:text-[24px]`}>
                  Contact Information
                </h2>

                <div className="flex w-full flex-col gap-[1px] lg:gap-[2px]">
                  <label htmlFor="pickup-name" className={`${LABEL_CLASSES} text-latte`}>
                    Customer Name <Asterisk />
                  </label>
                  <input
                    id="pickup-name"
                    type="text"
                    aria-required="true"
                    value={form.name}
                    onChange={update("name")}
                    className={`h-[39px] ${FIELD_CLASSES} lg:h-[60px]`}
                  />
                </div>

                <div className="flex w-full gap-[16px] lg:gap-[29px]">
                  <div className="flex min-w-0 flex-1 flex-col gap-[1px] lg:gap-[2px]">
                    <label htmlFor="pickup-email" className={`${LABEL_CLASSES} text-latte`}>
                      Email Address <Asterisk />
                    </label>
                    <input
                      id="pickup-email"
                      type="email"
                      aria-required="true"
                      value={form.email}
                      onChange={update("email")}
                      className={`h-[39px] ${FIELD_CLASSES} lg:h-[60px]`}
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-[1px] lg:gap-[2px]">
                    <label htmlFor="pickup-phone" className={`${LABEL_CLASSES} text-[#949494]`}>
                      Phone Number <Asterisk />
                    </label>
                    <input
                      id="pickup-phone"
                      type="tel"
                      aria-required="true"
                      value={form.phone}
                      onChange={update("phone")}
                      className={`h-[39px] ${FIELD_CLASSES} lg:h-[60px]`}
                    />
                  </div>
                </div>
              </div>

              {contactAttempted && !contactValid && (
                <p
                  role="alert"
                  className="text-center font-parkinsans text-[12px] text-[#c80000] lg:text-[17px]"
                >
                  Please fill in your name, a valid email address and a phone number.
                </p>
              )}

              <button type="submit" className={FILLED_BUTTON_CLASSES}>
                Share Info with the Owner
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ============ STAGES: SELECT / CONFIRM / DONE (500:12051,
          500:16491, 500:16525, 500:16532) - one section, the same slot on
          the page, four designed states. ============ */}
      {stage !== "cart" && stage !== "contact" && (
        <section className="mx-auto flex w-full max-w-[1440px] flex-col items-center px-[16px] pb-[48px] pt-[45px] lg:pb-[131px]">
          {stage === "done" ? (
            <div className="flex w-full flex-col items-center gap-[32px] lg:gap-[65px]">
              <div className="flex w-full flex-col gap-[8px] text-center lg:gap-[11px]">
                <h2 className={`${HEADING_CLASSES} w-full text-center text-[22.8px] lg:text-[40px]`}>
                  Hurray! Order Confirmed
                </h2>
                <p className="font-parkinsans text-[13px] text-cocoa lg:text-[20px]">
                  Can&rsquo;t wait to see you trying out products! See you soon :)
                </p>
              </div>
              <Link
                to="/"
                className="whitespace-nowrap rounded-full border border-cocoa px-[21px] py-[6px] font-parkinsans text-[13px] text-cocoa lg:px-[48px] lg:py-[10px] lg:text-[16px]"
              >
                Return to Homepage
              </Link>
            </div>
          ) : stage === "confirm" ? (
            <div className="flex w-full flex-col items-center gap-[32px] lg:gap-[65px]">
              <div className="flex w-full flex-col gap-[8px] text-center lg:gap-[11px]">
                <h2 className={`${HEADING_CLASSES} w-full text-center text-[22.8px] lg:text-[40px]`}>
                  confirm order
                </h2>
                <p className="font-parkinsans text-[13px] text-cocoa lg:text-[20px]">
                  Please click on the button below to confirm your choices.
                </p>
              </div>
              <div className="flex flex-col items-center gap-[12px]">
                {placeError && (
                  <p
                    role="alert"
                    className="text-center font-parkinsans text-[12px] text-[#c80000] lg:text-[17px]"
                  >
                    {placeError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={placing}
                  className={`${FILLED_BUTTON_CLASSES} disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {placing ? "Placing Order…" : "Place Order"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex w-full flex-col items-center gap-[32px] lg:gap-[64px]">
              {/* 500:13520. Figma draws it only on the Select Date frame, but
                  it is the whole step's way back, so it stays put across both
                  tabs rather than vanishing when the customer switches. */}
              <BackLink label="Go Back to Step 01" onClick={() => setStage("contact")} />

              <span className={`${STEP_BADGE_CLASSES} border border-[#e9dccf] bg-[#fdfcf8]`}>
                Step 02
              </span>

              <div className="flex w-full max-w-[456px] flex-col items-center gap-[28px] lg:gap-[45px]">
                <h2 className={`${HEADING_CLASSES} w-full text-center text-[19px] lg:text-[36px]`}>
                  please select
                </h2>
                {pickupAvailable && (
                  <div className="flex w-full items-center gap-[15px] lg:gap-[24px]">
                    {SELECT_TABS.map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setActiveTab(key)}
                        className={`flex-1 cursor-pointer whitespace-nowrap rounded-full bg-[#eaebe7] px-[20px] py-[5px] font-parkinsans text-[15px] text-bark transition-colors lg:px-[32px] lg:py-[8px] lg:text-[16px] ${
                          activeTab === key
                            ? "border-2 border-[#969985]"
                            : "border-2 border-transparent"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {!pickupAvailable ? (
                <p className="text-center font-parkinsans text-[14px] text-cocoa lg:text-[20px]">
                  Pickup is not available right now. Please choose delivery instead.
                </p>
              ) : activeTab === "date" ? (
                <>
                  <div className="flex items-center justify-center gap-[10px]">
                    <button
                      type="button"
                      aria-label="Previous month"
                      className="flex cursor-pointer items-center justify-center"
                    >
                      <img
                        src={arrowLeft}
                        alt=""
                        className="h-[16px] w-[14px] -scale-x-100 lg:h-[23.845px] lg:w-[20.356px]"
                      />
                    </button>
                    <p
                      className={`${HEADING_REGULAR_CLASSES} whitespace-nowrap text-center text-[24px] lg:w-[284px] lg:text-[36px]`}
                    >
                      August 2026
                    </p>
                    <button
                      type="button"
                      aria-label="Next month"
                      className="flex cursor-pointer items-center justify-center"
                    >
                      <img
                        src={arrowRight}
                        alt=""
                        className="h-[16px] w-[14px] lg:h-[23.845px] lg:w-[20.356px]"
                      />
                    </button>
                  </div>

                  <div className="flex w-full flex-col items-center gap-[24px] lg:gap-[36px]">
                    <p className="text-center font-parkinsans text-[13px] text-cocoa lg:text-[20px]">
                      {pickupDayCopy(pickupDates)}
                    </p>
                    <div className="flex w-full max-w-[518px] flex-wrap items-center justify-center gap-[9px] lg:gap-[14px]">
                      {pickupDates.map((d) => (
                        <button
                          key={d.date}
                          type="button"
                          onClick={() => setSelectedDate(d.date)}
                          className={`${PILL_CLASSES} ${
                            effectiveDate === d.date
                              ? "bg-taupe text-white"
                              : "bg-[#d8cbbe] text-cocoa"
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p
                    className={`${HEADING_REGULAR_CLASSES} w-full text-center text-[25px] lg:text-[36px]`}
                  >
                    {effectiveDateLabel}
                  </p>

                  <div className="flex w-full flex-col items-center gap-[40px] lg:gap-[90px]">
                    <div className="flex flex-col items-center gap-[4px] text-center lg:gap-[9px]">
                      <p className="font-parkinsans text-[17px] text-cocoa lg:text-[28px]">
                        Choose a time to pick up your order
                      </p>
                      <p className="font-parkinsans text-[12px] text-latte lg:text-[20px]">
                        Times are displayed in the store&rsquo;s local timezone.
                      </p>
                    </div>
                    <div className="flex w-full max-w-[518px] flex-wrap items-center justify-center gap-x-[9px] gap-y-[14px] lg:gap-x-[14px] lg:gap-y-[23px]">
                      {pickupSlots.map((s) => {
                        const value = slotValue(s);
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => chooseSlot(value)}
                            className={`${SLOT_PILL_CLASSES} ${
                              effectiveSlot === value
                                ? "bg-taupe text-white"
                                : "bg-[#d8cbbe] text-cocoa"
                            }`}
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
