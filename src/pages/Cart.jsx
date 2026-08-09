import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import OrderHero from "../components/OrderHero.jsx";
import { useCart } from "../context/CartContext.jsx";
import { fetchQuote } from "../lib/quote.js";
import { buildCheckoutToken, submitCheckout } from "../lib/checkout.js";
import iconBin from "../assets/cart/icon-bin.svg";
import iconMinus from "../assets/cart/icon-minus.svg";
import iconChevronDown from "../assets/cart/icon-chevron-down.svg";
import iconLocationPin from "../assets/cart/icon-location-pin.svg";
import bgPickupScallop from "../assets/cart/bg-pickup-scallop.svg";
import iconChevronLeft from "../assets/cart/icon-chevron-left.svg";
import iconChevronRight from "../assets/cart/icon-chevron-right.svg";

// Shown for any money figure whose quote hasn't landed yet - never blank
// beside a label, never a fabricated $0.00 (there's no currency object to
// build one from until a quote actually returns).
const PENDING = "—";

const CONTACT_FIELDS = [
  { key: "email", label: "Email Address", tone: "latte", type: "email" },
  { key: "phone", label: "Phone Number", tone: "muted", type: "tel" },
];

const ADDRESS_FIELD_ROWS = [
  [{ key: "fullName", label: "Full Name", tone: "latte" }],
  [{ key: "address1", label: "Address Line 1", tone: "muted" }],
  [{ key: "address2", label: "Address Line 2 (Optional)", tone: "muted" }],
  [
    { key: "city", label: "City", tone: "latte" },
    { key: "state", label: "State/ Province", tone: "muted" },
  ],
  [
    { key: "zip", label: "Zip/ Postal Code", tone: "latte" },
    { key: "country", label: "Country", tone: "muted", isSelect: true },
  ],
];

const COUNTRY_OPTIONS = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "India",
];

const PICKUP_CONTACT_FIELDS = [
  { key: "customerName", label: "Customer Name", required: true, full: true },
  { key: "pickupEmail", label: "Email Address(Optional)", required: false },
  { key: "pickupPhone", label: "Phone Number", required: true },
];

const PICKUP_DATES = ["2 Aug", "9 Aug", "16 Aug", "23 Aug"];

// The mobile pickup section (below) only ever shows this one location as
// static text - there is no store selector yet, so this mirrors that same
// string rather than inventing a second source of truth for it.
const PICKUP_STORE_NAME = "Orange County Store";

// Task 7's handoff redirects a failed checkout back to /cart?error=<code>.
// Every code it can send is listed here so none of them render silently.
const CHECKOUT_ERROR_MESSAGES = {
  out_of_area: "Sorry, we don't deliver to that postcode yet. Try pickup, or a different address.",
  below_minimum: "Your order is below the delivery minimum. Add a few more items to check out.",
  unavailable: "Checkout is temporarily unavailable. Please try again in a moment.",
  origin: "We couldn't verify that request. Please try checking out again.",
  throttled: "Too many attempts. Please wait a moment and try again.",
  coupon: "That coupon code didn't apply. Remove it or try a different code.",
};

const LABEL_TONE = {
  latte: "text-latte",
  muted: "text-[#949494]",
};

function Asterisk() {
  return <span className="text-[#c80000]">*</span>;
}

function FieldLabel({ label, tone, tight }) {
  return (
    <label
      className={`font-parkinsans text-[12px] lg:text-[20px] ${LABEL_TONE[tone]}`}
    >
      {tight ? (
        <>
          {label}
          <Asterisk />
        </>
      ) : (
        <>
          {label} <Asterisk />
        </>
      )}
    </label>
  );
}

/* A Lunch Box's chosen bread/cracker/dessert, as one line of text. Returns ""
   when nothing is chosen, so the caller can skip the row entirely rather than
   render an empty paragraph. */
function optionSummary(options) {
  if (!options) return "";
  return Object.values(options).filter(Boolean).join(" · ");
}

const INPUT_CLASSES =
  "h-[38px] w-full rounded-[6px] border border-[#e9dccf] bg-[#fdfcf8] px-[12px] font-parkinsans text-[13px] text-cocoa outline-none focus:border-[#d8cbbe] lg:h-[60px] lg:rounded-[10px] lg:px-[20px] lg:text-[18px]";

export default function Cart() {
  const cart = useCart();
  const [params] = useSearchParams();
  const checkoutErrorMessage = CHECKOUT_ERROR_MESSAGES[params.get("error")];
  const [mode, setMode] = useState("delivery");
  const [saveInfo, setSaveInfo] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [pickupTab, setPickupTab] = useState("date");
  const [deliveryFields, setDeliveryFields] = useState({});
  const [pickupFields, setPickupFields] = useState({});
  // Closes the human double-click: flipped synchronously inside the click
  // handler, before the form is even built, so a second click before
  // navigation completes hits a disabled button rather than racing the
  // first submission.
  const [submitting, setSubmitting] = useState(false);
  // null means "no quote has landed yet" - distinct from a real quote that
  // happens to have blank totals (a failed fetch). Both render as PENDING,
  // but only this flag decides whether the block below is even trustworthy.
  const [quote, setQuote] = useState(null);
  const hasQuoted = quote !== null;

  const updateDeliveryField = (key) => (e) =>
    setDeliveryFields((prev) => ({ ...prev, [key]: e.target.value }));
  const updatePickupField = (key) => (e) =>
    setPickupFields((prev) => ({ ...prev, [key]: e.target.value }));

  // Must pass line.options through: a line with options is keyed by
  // (id, options) in CartContext, not bare id, so omitting it here would
  // target a key that matches no line for e.g. a Lunch Box.
  const increment = (line) => cart.setQty(line.id, line.qty + 1, line.options);
  // The stepper never removes a line at zero - that's what the bin icon is
  // for - so decrementing clamps at 1 instead of letting setQty(0) drop it.
  const decrement = (line) => cart.setQty(line.id, Math.max(1, line.qty - 1), line.options);

  const postcode = deliveryFields.zip ?? "";
  // A string key of "id:qty" pairs, not `cart.lines` itself: syncSnapshot
  // below calls setLines on every quote, which produces a new array
  // reference even when nothing priced actually changed. Depending on the
  // array would re-quote forever against a rate-limited endpoint.
  const linesKey = cart.lines.map((l) => `${l.id}:${l.qty}`).join(",");

  // Derived once per cart state, not once per click - both clicks of a
  // double-click on an unchanged cart must carry the same token, or the
  // server's "have I seen this token" guard never fires. Same dependency
  // list as the quote effect below, for the same reason: depending on
  // `cart.lines` itself would change on every quote (syncSnapshot creates a
  // new array), producing a fresh token on every render.
  const checkoutToken = useMemo(
    () =>
      buildCheckoutToken({
        lines: cart.lines,
        fulfilment: mode,
        postcode,
        coupon: appliedCoupon,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [linesKey, mode, postcode, appliedCoupon],
  );

  const handleCheckout = () => {
    setSubmitting(true);
    const isPickup = mode === "pickup";
    submitCheckout({
      lines: cart.lines,
      fulfilment: mode,
      token: checkoutToken,
      coupon: appliedCoupon,
      email: isPickup ? pickupFields.pickupEmail : deliveryFields.email,
      phone: isPickup ? pickupFields.pickupPhone : deliveryFields.phone,
      fullName: isPickup ? pickupFields.customerName : deliveryFields.fullName,
      address1: deliveryFields.address1,
      address2: deliveryFields.address2,
      city: deliveryFields.city,
      state: deliveryFields.state,
      postcode: deliveryFields.zip,
      pickupStore: PICKUP_STORE_NAME,
      pickupDate: selectedDate ?? "",
      // No time-slot picker exists in this plan yet (pickup scheduling is a
      // later plan's scope) - sent empty rather than invented.
      pickupSlot: "",
    });
  };

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetchQuote({
        lines: cart.lines,
        fulfilment: mode,
        postcode,
        coupon: appliedCoupon,
        signal: controller.signal,
      }).then((result) => {
        // A newer request may have already superseded this one - its
        // cleanup below aborted this controller, so a late-arriving
        // response here must not overwrite a fresher total.
        if (controller.signal.aborted) return;
        setQuote(result);
        if (result.ok) {
          result.lines.forEach((line) =>
            cart.syncSnapshot(line.id, line.unitFormatted)
          );
        }
      });
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linesKey, mode, postcode, appliedCoupon]);

  // `|| PENDING` (not `?? PENDING`) on purpose: a landed-but-failed quote
  // (network error, non-200) is a real object with genuinely blank ""
  // strings, not null - it must show the same placeholder, not an empty row.
  const quoteLineTotals = new Map(
    (quote?.lines ?? []).map((l) => [l.id, l.totalFormatted])
  );
  const summaryRows = [
    { key: "subtotal", label: "Subtotal", value: quote?.subtotalFormatted || PENDING },
    { key: "shipping", label: "Shipping", value: quote?.deliveryFormatted || PENDING },
    { key: "discount", label: "Discount", value: quote?.discountFormatted || PENDING },
  ];
  const checkoutDisabled = cart.isEmpty || !hasQuoted || quote.errors.length > 0;

  // The order summary + coupon + Proceed to Checkout markup, defined once so
  // delivery and pickup mode share the exact same JSX rather than each
  // owning a competing copy of the checkout button. Only one of the two mode
  // blocks below is ever mounted at a time, so this only ever renders once.
  const orderSummaryColumn = (
    <div className="flex flex-col gap-[16px] lg:gap-[24px]">
      <div className="flex w-full flex-col gap-[64px] rounded-[16px] border border-[#d8cbbe] bg-[#f7f5f1] px-[20px] py-[24px] lg:px-[28px] lg:py-[39px]">
        <div className="flex w-full flex-col gap-[8px]">
          <div className="flex w-full flex-col gap-[24px]">
            <p className="font-ligema text-[13.3px] uppercase text-cocoa lg:text-[17.1px]">
              Order Summary
            </p>
            {!cart.isEmpty && (
              <div className="flex w-full flex-col gap-[18px]">
                <div className="h-px w-full bg-[#d9d9d9]" />
                <div className="flex w-full items-center justify-between font-parkinsans text-cocoa">
                  <p className="text-[16px]">Items</p>
                  <p className="text-[20px]">{cart.count}</p>
                </div>
                {summaryRows.map((row) => (
                  <div
                    key={row.key}
                    className="flex w-full items-center justify-between font-parkinsans text-cocoa"
                  >
                    <p className="text-[16px]">{row.label}</p>
                    <p className="text-[20px]">{row.value}</p>
                  </div>
                ))}
                <div className="h-px w-full bg-[#d9d9d9]" />
              </div>
            )}
          </div>
          {!cart.isEmpty && (
            <div className="flex w-full items-center justify-between font-parkinsans font-medium text-cocoa">
              <p className="text-[20px]">Total</p>
              <p className="text-[24px]">{quote?.totalFormatted || PENDING}</p>
            </div>
          )}
        </div>
        <div className="flex w-full flex-col gap-[12px]">
          {hasQuoted && quote.errors.length > 0 && (
            <p role="alert" className="font-parkinsans text-[13px] text-[#c80000]">
              {quote.errors.join(" ")}
            </p>
          )}
          <button
            type="button"
            onClick={handleCheckout}
            disabled={checkoutDisabled || submitting}
            className="w-full cursor-pointer rounded-[100px] bg-cocoa p-[10px] font-parkinsans text-[16px] text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>

      <div className="flex h-[75px] w-full items-center justify-center rounded-[12px] border border-[#d8cbbe] bg-[#f7f5f1] lg:h-[85px] lg:rounded-[16px]">
        <input
          type="text"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}
          placeholder="Enter Coupon Code"
          className="h-[39px] flex-1 rounded-l-[12px] border-y border-l border-[#e3e3e3] bg-[#fbfbf8] px-[10px] font-parkinsans text-[13px] text-clay outline-none lg:h-[44px] lg:rounded-l-[16px] lg:px-[10px] lg:text-[16px]"
        />
        <button
          type="button"
          onClick={() => setAppliedCoupon(promoCode)}
          className="h-[39px] shrink-0 cursor-pointer rounded-r-[12px] bg-clay px-[14px] font-parkinsans text-[13px] font-medium text-white lg:h-[44px] lg:rounded-r-[16px] lg:px-[10px] lg:text-[16px]"
        >
          Apply Coupon
        </button>
      </div>
    </div>
  );

  return (
    <main className="w-full bg-cream">
      <OrderHero mode={mode} step={mode === "delivery" ? 1 : null} />

      {checkoutErrorMessage && (
        <p
          role="alert"
          className="mx-auto w-full max-w-[1440px] px-[16px] pt-[16px] text-center font-parkinsans text-[13px] text-[#c80000] lg:px-[72px] lg:text-[16px]"
        >
          {checkoutErrorMessage}
        </p>
      )}

      {/* mobile-only switcher between the two designed Cart states (Delivery / Pickup) */}
      <div className="mx-auto flex w-full max-w-[1440px] justify-center gap-[8px] px-[16px] pt-[24px] lg:hidden">
        <button
          type="button"
          onClick={() => setMode("delivery")}
          className={`cursor-pointer rounded-full px-[18px] py-[7px] font-parkinsans text-[13px] ${
            mode === "delivery" ? "bg-cocoa text-white" : "bg-oat text-cocoa"
          }`}
        >
          Delivery Cart
        </button>
        <button
          type="button"
          onClick={() => setMode("pickup")}
          className={`cursor-pointer rounded-full px-[18px] py-[7px] font-parkinsans text-[13px] ${
            mode === "pickup" ? "bg-cocoa text-white" : "bg-oat text-cocoa"
          }`}
        >
          Pickup Cart
        </button>
      </div>

      {/* ===================== DELIVERY STATE =====================
          Mounted only in delivery mode - real conditional rendering, not a
          CSS class, so pickup mode never carries this (and its checkout
          button) into the DOM at any breakpoint. Classes below are
          unchanged from before: this is exactly what rendered when
          mode === "delivery" previously. */}
      {mode === "delivery" && (
      <div className="mx-auto w-full max-w-[1440px] px-[16px] pb-[40px] pt-[16px] lg:px-[72px] lg:pb-[96px] lg:pt-[64px]">
        <div className="flex flex-col gap-[16px] lg:grid lg:grid-cols-[857fr_420fr] lg:items-start lg:gap-x-[16px]">
          {/* column 1: cart items + delivery information */}
          <div className="flex flex-col gap-[16px] lg:gap-[24px]">
            {/* Cart Items panel */}
            <div className="flex w-full flex-col gap-[12px] rounded-[10px] border border-[#d8cbbe] bg-[#f7f5f1] p-[12px] lg:gap-[19px] lg:rounded-[16px] lg:p-[16px]">
              <div className="flex h-[38px] items-center justify-between rounded-[7px] bg-[#d8cbbe] px-[13px] font-parkinsans text-[16px] font-medium text-cocoa lg:h-[61px] lg:rounded-[16px] lg:px-[30px] lg:text-[20px]">
                <p>Cart Items ({cart.count})</p>
                <button
                  type="button"
                  onClick={() => cart.clear()}
                  className="cursor-pointer font-parkinsans text-[14px] underline lg:text-[20px]"
                >
                  Clear Cart
                </button>
              </div>

              {cart.isEmpty ? (
                <p className="py-[12px] text-center font-parkinsans text-[14px] text-cocoa lg:text-[18px]">
                  Your cart is empty.
                </p>
              ) : (
                cart.lines.map((line) => (
                  <div
                    key={`${line.id}:${line.options ? Object.values(line.options).join('|') : ''}`}
                    className="flex w-full items-center gap-[15px] lg:gap-[17px]"
                  >
                    <img
                      src={line.image || undefined}
                      alt={line.name}
                      className="h-[147px] w-[177px] shrink-0 rounded-[3px] object-cover lg:h-[122px] lg:w-[148px] lg:rounded-[8px]"
                    />
                    <div className="flex flex-1 flex-col items-start gap-[13px] lg:flex-row lg:items-center lg:justify-between lg:gap-[67px]">
                      <div className="flex flex-col gap-[13px] lg:flex-row lg:items-center lg:gap-[84px]">
                        <div className="flex flex-col gap-[2px] lg:gap-[3px]">
                          <p className="font-parkinsans text-[16px] text-cocoa lg:text-[24px]">
                            {line.name}
                          </p>
                          <p className="font-parkinsans text-[20px] text-cocoa">
                            {line.priceFormatted}
                          </p>
                          {optionSummary(line.options) && (
                            <p className={`font-parkinsans text-[12px] ${LABEL_TONE.muted}`}>
                              {optionSummary(line.options)}
                            </p>
                          )}
                        </div>
                        <div className="flex w-[80px] shrink-0 items-center justify-center gap-[17px] rounded-full border-[1.3px] border-taupe/30 px-[10px] py-[5px] font-parkinsans font-semibold text-taupe/80 lg:w-[124px] lg:gap-[27px] lg:border-2 lg:px-[15px] lg:py-[8px]">
                          <button
                            type="button"
                            aria-label={`Decrease ${line.name} quantity`}
                            onClick={() => decrement(line)}
                            className="flex cursor-pointer items-center justify-center"
                          >
                            <img
                              src={iconMinus}
                              alt=""
                              className="h-[10px] w-[8px] lg:hidden"
                            />
                            <span className="hidden text-[20px] lg:inline">
                              &minus;
                            </span>
                          </button>
                          <span className="text-[15px] lg:text-[20px]">
                            {line.qty}
                          </span>
                          <button
                            type="button"
                            aria-label={`Increase ${line.name} quantity`}
                            onClick={() => increment(line)}
                            className="cursor-pointer text-[14px] lg:text-[20px]"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="hidden items-center gap-[35px] lg:flex">
                        <p className="font-parkinsans text-[24px] text-cocoa">
                          {quoteLineTotals.get(line.id) || PENDING}
                        </p>
                        <button
                          type="button"
                          aria-label={`Remove ${line.name} from cart`}
                          onClick={() => cart.remove(line.id, line.options)}
                          className="cursor-pointer"
                        >
                          <img src={iconBin} alt="" className="size-[30px]" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Delivery Information panel */}
            <div className="flex w-full flex-col items-end gap-[20px] rounded-[10px] border border-[#d8cbbe] bg-[#f7f5f1] px-[16px] py-[16px] lg:gap-[33px] lg:rounded-[16px] lg:px-[42px] lg:py-[24px]">
              <div className="flex h-[38px] w-full items-center rounded-[10px] bg-[#d8cbbe] px-[18px] font-parkinsans text-[16px] font-medium text-cocoa lg:h-[61px] lg:rounded-[16px] lg:px-[30px] lg:text-[20px]">
                Delivery Information
              </div>

              <div className="flex w-full flex-col gap-[15px] lg:gap-[24px]">
                <div className="flex w-full flex-col gap-[10px] lg:gap-[16px]">
                  <p className="font-ligema text-[11.4px] uppercase tracking-[0.6px] text-cocoa lg:text-[19px] lg:tracking-[0.9px]">
                    Contact Information
                  </p>
                  <div className="flex w-full gap-[18px] lg:gap-[29px]">
                    {CONTACT_FIELDS.map((field) => (
                      <div
                        key={field.key}
                        className="flex min-w-0 flex-1 flex-col gap-[1px] lg:gap-[2px]"
                      >
                        <FieldLabel label={field.label} tone={field.tone} />
                        <input
                          type={field.type}
                          name={field.key}
                          value={deliveryFields[field.key] ?? ""}
                          onChange={updateDeliveryField(field.key)}
                          className={INPUT_CLASSES}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex w-full flex-col gap-[10px] lg:gap-[16px]">
                  <p className="font-ligema text-[11.4px] uppercase tracking-[0.6px] text-cocoa lg:text-[19px] lg:tracking-[0.9px]">
                    Shipping Address
                  </p>
                  <div className="flex w-full flex-col gap-[15px] lg:gap-[24px]">
                    {ADDRESS_FIELD_ROWS.map((row, rowIndex) => (
                      <div
                        key={rowIndex}
                        className="flex w-full gap-[18px] lg:gap-[29px]"
                      >
                        {row.map((field) => (
                          <div
                            key={field.key}
                            className="flex min-w-0 flex-1 flex-col gap-[1px] lg:gap-[2px]"
                          >
                            <FieldLabel
                              label={field.label}
                              tone={field.tone}
                              tight={field.key === "fullName"}
                            />
                            {field.isSelect ? (
                              <div className="relative w-full">
                                <select
                                  name={field.key}
                                  value={deliveryFields[field.key] ?? ""}
                                  onChange={updateDeliveryField(field.key)}
                                  className={`appearance-none ${INPUT_CLASSES}`}
                                >
                                  <option value="" hidden></option>
                                  {COUNTRY_OPTIONS.map((c) => (
                                    <option key={c} value={c}>
                                      {c}
                                    </option>
                                  ))}
                                </select>
                                <img
                                  src={iconChevronDown}
                                  alt=""
                                  className="pointer-events-none absolute right-[16px] top-1/2 h-[8px] w-[15px] -translate-y-1/2 lg:right-[20px] lg:h-[9px] lg:w-[18px]"
                                />
                              </div>
                            ) : (
                              <input
                                type="text"
                                name={field.key}
                                value={deliveryFields[field.key] ?? ""}
                                onChange={updateDeliveryField(field.key)}
                                className={INPUT_CLASSES}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  <p className="font-parkinsans text-[11px] text-[#c80000] lg:text-[17px]">
                    Fields marked * are mandatory
                  </p>
                </div>

                <label
                  htmlFor="save-info"
                  className="flex w-full cursor-pointer items-center gap-[9px] lg:gap-[14px]"
                >
                  <input
                    id="save-info"
                    type="checkbox"
                    checked={saveInfo}
                    onChange={(e) => setSaveInfo(e.target.checked)}
                    className="size-[15px] shrink-0 cursor-pointer appearance-none rounded-[3px] border border-[#c7c7c7] bg-[#f7f7f7] checked:border-cocoa checked:bg-cocoa lg:size-[23px]"
                  />
                  <span className="font-parkinsans text-[13px] text-latte lg:text-[20px]">
                    Save this information for next time
                  </span>
                </label>
              </div>

              <button
                type="button"
                className="cursor-pointer whitespace-nowrap rounded-full bg-cocoa px-[20px] py-[6px] font-parkinsans capitalize text-[13px] text-white lg:px-[32px] lg:py-[10px] lg:text-[16px]"
              >
                Submit
              </button>
            </div>
          </div>

          {/* column 2: order summary + coupon */}
          {orderSummaryColumn}
        </div>
      </div>
      )}

      {/* ===================== PICKUP STATE =====================
          Same real-conditional-mount treatment as delivery above, and no
          longer forced lg:hidden - Figma never drew a desktop pickup layout,
          so this mobile-designed content is reused as-is at the lg
          breakpoint (the sanctioned exception) rather than leaving desktop
          pickup customers with the delivery form. The reused order summary
          + checkout button below is what makes checkout reachable here. */}
      {mode === "pickup" && (
      <div className="flex w-full flex-col lg:mx-auto lg:max-w-[600px]">
        {/* Pick up from <store> */}
        <section className="relative w-full overflow-hidden bg-rose py-[26px]">
          <img
            src={bgPickupScallop}
            alt=""
            className="pointer-events-none absolute left-1/2 top-0 h-[178px] w-[1096px] max-w-none -translate-x-1/2"
          />
          <div className="relative flex flex-col items-center gap-[7px] px-[16px]">
            <p className="font-ligema text-[16.1px] uppercase text-cocoa">
              Pick up from
            </p>
            <div className="flex items-center gap-[8px] rounded-[11px] border border-[rgba(204,138,122,0.39)] bg-[#f4e7e3] px-[10px] py-[10px]">
              <img src={iconLocationPin} alt="" className="size-[24px]" />
              <p className="font-parkinsans text-[16px] text-cocoa">
                Orange County Store
              </p>
            </div>
          </div>
        </section>

        <div className="flex w-full flex-col gap-[24px] px-[16px] py-[24px]">
          {/* Contact Information */}
          <div className="flex w-full flex-col gap-[12px] rounded-[12px] border border-[#d8cbbe] bg-[#fffffd] p-[24px]">
            <p className="font-ligema text-[12.8px] uppercase tracking-[0.7px] text-cocoa">
              Contact Information
            </p>
            <div className="flex w-full flex-col gap-[16px]">
              {PICKUP_CONTACT_FIELDS.map((field) =>
                field.full ? (
                  <div key={field.key} className="flex w-full flex-col gap-[2px]">
                    <label className="font-parkinsans text-[12px] text-latte">
                      {field.label} {field.required && <Asterisk />}
                    </label>
                    <input
                      type="text"
                      name={field.key}
                      value={pickupFields[field.key] ?? ""}
                      onChange={updatePickupField(field.key)}
                      className={INPUT_CLASSES}
                    />
                  </div>
                ) : null
              )}
              <div className="flex w-full gap-[20px]">
                {PICKUP_CONTACT_FIELDS.filter((f) => !f.full).map((field) => (
                  <div
                    key={field.key}
                    className="flex min-w-0 flex-1 flex-col gap-[2px]"
                  >
                    <label className="font-parkinsans text-[12px] text-latte">
                      {field.label} {field.required && <Asterisk />}
                    </label>
                    <input
                      type="text"
                      name={field.key}
                      value={pickupFields[field.key] ?? ""}
                      onChange={updatePickupField(field.key)}
                      className={INPUT_CLASSES}
                    />
                  </div>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="w-fit cursor-pointer whitespace-nowrap rounded-full bg-taupe px-[12px] py-[6px] font-parkinsans text-[12px] text-white"
            >
              Add to Cart
            </button>
          </div>

          {/* Select pickup date/time */}
          <div className="flex w-full flex-col items-center gap-[27px] rounded-[12px] bg-[#fbfbf8] py-[16px]">
            <div className="flex flex-col items-center gap-[19px]">
              <p className="font-ligema text-[12.8px] uppercase text-cocoa">
                Please Select
              </p>
              <div className="flex items-center gap-[10px]">
                <button
                  type="button"
                  onClick={() => setPickupTab("date")}
                  className={`cursor-pointer whitespace-nowrap rounded-full border px-[14px] py-[5px] font-parkinsans text-[13px] text-[#2e2017] ${
                    pickupTab === "date"
                      ? "border-[#969985] bg-[#eaebe7]"
                      : "border-transparent bg-[#eaebe7]"
                  }`}
                >
                  Pick Up Date
                </button>
                <button
                  type="button"
                  onClick={() => setPickupTab("time")}
                  className={`cursor-pointer whitespace-nowrap rounded-full border px-[14px] py-[5px] font-parkinsans text-[13px] text-[#2e2017] ${
                    pickupTab === "time"
                      ? "border-[#969985] bg-[#eaebe7]"
                      : "border-transparent bg-[#eaebe7]"
                  }`}
                >
                  Pick Up Time
                </button>
              </div>
            </div>

            <div className="flex items-center gap-[6px]">
              <button type="button" aria-label="Previous month" className="cursor-pointer">
                <img src={iconChevronLeft} alt="" className="h-[14px] w-[12px]" />
              </button>
              <p className="font-parkinsans text-[17px] uppercase text-cocoa">
                August 2026
              </p>
              <button type="button" aria-label="Next month" className="cursor-pointer">
                <img src={iconChevronRight} alt="" className="h-[14px] w-[12px]" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-[15px] px-[16px]">
              <p className="text-center font-parkinsans text-[14px] text-cocoa">
                Choose a Sunday to pick up your order
              </p>
              <div className="flex gap-[6px]">
                {PICKUP_DATES.map((date) => (
                  <button
                    key={date}
                    type="button"
                    onClick={() => setSelectedDate(date)}
                    className={`cursor-pointer whitespace-nowrap rounded-[9px] px-[10px] py-[5px] font-parkinsans text-[12px] ${
                      selectedDate === date
                        ? "bg-cocoa text-white"
                        : "bg-[#d8cbbe] text-cocoa"
                    }`}
                  >
                    {date}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* order summary + coupon - reused from delivery mode; this is the
              only Proceed to Checkout button rendered while mode is pickup */}
          {orderSummaryColumn}
        </div>
      </div>
      )}
    </main>
  );
}
