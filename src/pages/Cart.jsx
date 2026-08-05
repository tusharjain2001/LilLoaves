import { useState } from "react";
import OrderHero from "../components/OrderHero.jsx";
import productBlueberryMuffin from "../assets/cart/product-blueberry-muffin.png";
import productChocolateMuffin from "../assets/cart/product-chocolate-muffin.png";
import productMilkBread from "../assets/cart/product-milk-bread.png";
import iconBin from "../assets/cart/icon-bin.svg";
import iconMinus from "../assets/cart/icon-minus.svg";
import iconChevronDown from "../assets/cart/icon-chevron-down.svg";
import iconLocationPin from "../assets/cart/icon-location-pin.svg";
import bgPickupScallop from "../assets/cart/bg-pickup-scallop.svg";
import iconChevronLeft from "../assets/cart/icon-chevron-left.svg";
import iconChevronRight from "../assets/cart/icon-chevron-right.svg";

const INITIAL_CART_ITEMS = [
  {
    id: "blueberry-muffin",
    name: "Blueberry Muffin",
    price: 21.13,
    img: productBlueberryMuffin,
  },
  {
    id: "chocolate-muffin",
    name: "Chocolate Muffin",
    price: 21.13,
    img: productChocolateMuffin,
    desktopOnly: true,
  },
  {
    id: "japanese-milk-bread",
    name: "Japanese Milk Bread",
    price: 21.13,
    img: productMilkBread,
  },
];

const SUMMARY_ROWS = [
  { key: "subtotal", label: "Subtotal", value: "$40" },
  { key: "shipping", label: "Shipping", value: "$5" },
  { key: "discount", label: "Discount", value: "$6" },
];

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

const INPUT_CLASSES =
  "h-[38px] w-full rounded-[6px] border border-[#e9dccf] bg-[#fdfcf8] px-[12px] font-parkinsans text-[13px] text-cocoa outline-none focus:border-[#d8cbbe] lg:h-[60px] lg:rounded-[10px] lg:px-[20px] lg:text-[18px]";

export default function Cart() {
  const [mode, setMode] = useState("delivery");
  const [cartItems, setCartItems] = useState(INITIAL_CART_ITEMS);
  const [saveInfo, setSaveInfo] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [pickupTab, setPickupTab] = useState("date");

  const increment = (id) =>
    setCartItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, qty: (it.qty ?? 1) + 1 } : it))
    );

  const decrement = (id) =>
    setCartItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, qty: Math.max(1, (it.qty ?? 1) - 1) } : it
      )
    );

  const removeItem = (id) =>
    setCartItems((prev) => prev.filter((it) => it.id !== id));

  return (
    <main className="w-full bg-cream">
      <OrderHero mode={mode} step={mode === "delivery" ? 1 : null} />

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

      {/* ===================== DELIVERY STATE ===================== */}
      <div
        className={`mx-auto w-full max-w-[1440px] px-[16px] pb-[40px] pt-[16px] lg:px-[72px] lg:pb-[96px] lg:pt-[64px] ${
          mode === "pickup" ? "hidden lg:block" : "block"
        }`}
      >
        <div className="flex flex-col gap-[16px] lg:grid lg:grid-cols-[857fr_420fr] lg:items-start lg:gap-x-[16px]">
          {/* column 1: cart items + delivery information */}
          <div className="flex flex-col gap-[16px] lg:gap-[24px]">
            {/* Cart Items panel */}
            <div className="flex w-full flex-col gap-[12px] rounded-[10px] border border-[#d8cbbe] bg-[#f7f5f1] p-[12px] lg:gap-[19px] lg:rounded-[16px] lg:p-[16px]">
              <div className="flex h-[38px] items-center justify-between rounded-[7px] bg-[#d8cbbe] px-[13px] font-parkinsans text-[16px] font-medium text-cocoa lg:h-[61px] lg:rounded-[16px] lg:px-[30px] lg:text-[20px]">
                <p>Cart Items ({cartItems.length})</p>
                <button
                  type="button"
                  onClick={() => setCartItems([])}
                  className="cursor-pointer font-parkinsans text-[14px] underline lg:text-[20px]"
                >
                  Clear Cart
                </button>
              </div>

              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className={`w-full items-center gap-[15px] lg:gap-[17px] ${
                    item.desktopOnly ? "hidden lg:flex" : "flex"
                  }`}
                >
                  <img
                    src={item.img}
                    alt={item.name}
                    className="h-[147px] w-[177px] shrink-0 rounded-[3px] object-cover lg:h-[122px] lg:w-[148px] lg:rounded-[8px]"
                  />
                  <div className="flex flex-1 flex-col items-start gap-[13px] lg:flex-row lg:items-center lg:justify-between lg:gap-[67px]">
                    <div className="flex flex-col gap-[13px] lg:flex-row lg:items-center lg:gap-[84px]">
                      <div className="flex flex-col gap-[2px] lg:gap-[3px]">
                        <p className="font-parkinsans text-[16px] text-cocoa lg:text-[24px]">
                          {item.name}
                        </p>
                        <p className="font-parkinsans text-[20px] text-cocoa">
                          ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex w-[80px] shrink-0 items-center justify-center gap-[17px] rounded-full border-[1.3px] border-taupe/30 px-[10px] py-[5px] font-parkinsans font-semibold text-taupe/80 lg:w-[124px] lg:gap-[27px] lg:border-2 lg:px-[15px] lg:py-[8px]">
                        <button
                          type="button"
                          aria-label={`Decrease ${item.name} quantity`}
                          onClick={() => decrement(item.id)}
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
                          {item.qty ?? 1}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase ${item.name} quantity`}
                          onClick={() => increment(item.id)}
                          className="cursor-pointer text-[14px] lg:text-[20px]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="hidden items-center gap-[35px] lg:flex">
                      <p className="font-parkinsans text-[24px] text-cocoa">
                        ${(item.price * (item.qty ?? 1)).toFixed(2)}
                      </p>
                      <button
                        type="button"
                        aria-label={`Remove ${item.name} from cart`}
                        onClick={() => removeItem(item.id)}
                        className="cursor-pointer"
                      >
                        <img src={iconBin} alt="" className="size-[30px]" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
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
                        <input type={field.type} className={INPUT_CLASSES} />
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
                                  defaultValue=""
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
                              <input type="text" className={INPUT_CLASSES} />
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
          <div className="flex flex-col gap-[16px] lg:gap-[24px]">
            <div className="flex w-full flex-col gap-[64px] rounded-[16px] border border-[#d8cbbe] bg-[#f7f5f1] px-[20px] py-[24px] lg:px-[28px] lg:py-[39px]">
              <div className="flex w-full flex-col gap-[8px]">
                <div className="flex w-full flex-col gap-[24px]">
                  <p className="font-ligema text-[13.3px] uppercase text-cocoa lg:text-[17.1px]">
                    Order Summary
                  </p>
                  <div className="flex w-full flex-col gap-[18px]">
                    <div className="h-px w-full bg-[#d9d9d9]" />
                    <div className="flex w-full items-center justify-between font-parkinsans text-cocoa">
                      <p className="text-[16px]">Items</p>
                      <p className="text-[20px]">{cartItems.length}</p>
                    </div>
                    {SUMMARY_ROWS.map((row) => (
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
                </div>
                <div className="flex w-full items-center justify-between font-parkinsans font-medium text-cocoa">
                  <p className="text-[20px]">Total</p>
                  <p className="text-[24px]">$39</p>
                </div>
              </div>
              <button
                type="button"
                className="w-full cursor-pointer rounded-[100px] bg-cocoa p-[10px] font-parkinsans text-[16px] text-white"
              >
                Proceed to Checkout
              </button>
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
                className="h-[39px] shrink-0 cursor-pointer rounded-r-[12px] bg-clay px-[14px] font-parkinsans text-[13px] font-medium text-white lg:h-[44px] lg:rounded-r-[16px] lg:px-[10px] lg:text-[16px]"
              >
                Apply Coupon
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== PICKUP STATE (mobile only design) ===================== */}
      <div
        className={`w-full lg:hidden ${
          mode === "pickup" ? "flex flex-col" : "hidden"
        }`}
      >
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
                    <input type="text" className={INPUT_CLASSES} />
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
                    <input type="text" className={INPUT_CLASSES} />
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
        </div>
      </div>
    </main>
  );
}
