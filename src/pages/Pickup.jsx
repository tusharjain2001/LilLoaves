import { useEffect, useState } from "react";
import OrderHero from "../components/OrderHero.jsx";
import { fetchPickupConfig, slotValue, pickupDayCopy } from "../lib/pickup.js";
import waveRose from "../assets/pickup/wave-rose.svg";
import iconLocation from "../assets/pickup/icon-location.svg";
import arrowLeft from "../assets/pickup/arrow-left.svg";
import arrowRight from "../assets/pickup/arrow-right.svg";

const SELECT_TABS = [
  { key: "date", label: "Pick Up Date" },
  { key: "time", label: "Pick Up Time" },
];

const LABEL_CLASSES = "font-parkinsans text-[13px] text-latte lg:text-[20px]";

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

const INITIAL_FORM = { name: "", email: "", phone: "" };

function Asterisk() {
  return <span className="text-[#c80000]">*</span>;
}

export default function Pickup() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [activeTab, setActiveTab] = useState("date");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  // null means "hasn't landed yet". Same WooCommerce > Fulfilment config
  // Cart.jsx reads, via the same lib/pickup.js module, so this page can
  // never show a date/time the cart wouldn't also offer.
  const [pickupConfig, setPickupConfig] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchPickupConfig({ signal: controller.signal }).then((config) => {
      if (controller.signal.aborted) return;
      setPickupConfig(config);
    });
    return () => controller.abort();
  }, []);

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

  const update = (key) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <main className="w-full overflow-x-hidden bg-cream">
      <OrderHero mode="pickup" />

      {/* PICK UP FROM */}
      <section className="relative h-[220px] w-full lg:h-[253px]">
        <img
          src={waveRose}
          alt=""
          className="absolute inset-0 h-full w-full"
        />
        <div className="relative z-10 mx-auto flex h-full w-full max-w-[1440px] flex-col items-center justify-center gap-[16px] px-[16px] text-center lg:gap-[24px]">
          <h2 className="font-ligema text-[22.8px] uppercase leading-[19px] text-cocoa">
            Pick up from
          </h2>
          <div className="inline-flex items-center gap-[8px] rounded-[16px] border border-[rgba(204,138,122,0.39)] bg-[#f4e7e3] px-[14px] py-[10px]">
            <img
              src={iconLocation}
              alt=""
              className="size-[34px] shrink-0"
            />
            <span className="whitespace-nowrap font-parkinsans text-[28px] text-cocoa">
              {pickupStore ? pickupStore.name : "Unavailable"}
            </span>
          </div>
        </div>
      </section>

      {/* CONTACT INFORMATION */}
      <section className="mx-auto w-full max-w-[1440px] px-[16px] pb-[40px] pt-[32px] lg:px-[181px] lg:pb-[66px] lg:pt-[64px]">
        <form
          onSubmit={handleSubmit}
          className="w-full rounded-[10px] border border-[#d8cbbe] bg-[#fffffd] px-[16px] py-[24px] lg:rounded-[16px] lg:p-[32px]"
        >
          <div className="flex w-full flex-col items-start gap-[16px] lg:gap-[24px]">
            <h2 className="font-ligema text-[11.4px] uppercase tracking-[0.5px] text-cocoa lg:text-[19px] lg:tracking-[0.9px]">
              Contact Information
            </h2>

            <div className="flex w-full flex-col gap-[1px] lg:gap-[2px]">
              <label htmlFor="pickup-name" className={LABEL_CLASSES}>
                Customer Name <Asterisk />
              </label>
              <input
                id="pickup-name"
                type="text"
                value={form.name}
                onChange={update("name")}
                className={`h-[39px] ${FIELD_CLASSES} lg:h-[60px]`}
              />
            </div>

            <div className="flex w-full gap-[16px] lg:gap-[29px]">
              <div className="flex min-w-0 flex-1 flex-col gap-[1px] lg:gap-[2px]">
                <label htmlFor="pickup-email" className={LABEL_CLASSES}>
                  Email Address (Optional)
                </label>
                <input
                  id="pickup-email"
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                  className={`h-[39px] ${FIELD_CLASSES} lg:h-[60px]`}
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-[1px] lg:gap-[2px]">
                <label htmlFor="pickup-phone" className={LABEL_CLASSES}>
                  Phone Number <Asterisk />
                </label>
                <input
                  id="pickup-phone"
                  type="tel"
                  value={form.phone}
                  onChange={update("phone")}
                  className={`h-[39px] ${FIELD_CLASSES} lg:h-[60px]`}
                />
              </div>
            </div>

            <p className="font-parkinsans text-[12px] text-[#c80000] lg:text-[17px]">
              Fields marked * are mandatory
            </p>

            <button
              type="submit"
              className="cursor-pointer whitespace-nowrap rounded-full bg-taupe px-[21px] py-[6px] font-parkinsans text-[13px] text-white lg:px-[24px] lg:py-[8px] lg:text-[16px]"
            >
              Add to Cart
            </button>
          </div>
        </form>
      </section>

      {/* PLEASE SELECT - date / time */}
      <section className="mx-auto w-full max-w-[1440px] px-[16px] pb-[48px] pt-[32px] lg:pb-[146px] lg:pt-[146px]">
        <div className="mx-auto flex w-full max-w-[456px] flex-col items-center gap-[28px] lg:gap-[45px]">
          <h2 className="text-center font-ligema text-[19px] uppercase text-cocoa lg:text-[30.4px]">
            please select
          </h2>
          {pickupAvailable && (
            <div className="flex w-full items-center gap-[15px] lg:gap-[24px]">
              {SELECT_TABS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`flex-1 cursor-pointer whitespace-nowrap rounded-full bg-[#eaebe7] px-[20px] py-[5px] font-parkinsans text-[15px] text-[#2e2017] transition-colors lg:px-[32px] lg:py-[8px] lg:text-[16px] ${
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
          <p className="mt-[32px] text-center font-parkinsans text-[14px] text-cocoa lg:mt-[56px] lg:text-[20px]">
            Pickup is not available right now. Please choose delivery instead.
          </p>
        ) : activeTab === "date" ? (
          <div className="mt-[32px] flex flex-col items-center gap-[24px] lg:mt-[56px] lg:gap-[36px]">
            <div className="flex items-center gap-[16px] lg:gap-[24px]">
              <button
                type="button"
                aria-label="Previous month"
                className="flex cursor-pointer items-center justify-center"
              >
                <img
                  src={arrowLeft}
                  alt=""
                  className="h-[16px] w-[14px] -scale-x-100 lg:h-[24px] lg:w-[20px]"
                />
              </button>
              <p className="whitespace-nowrap font-parkinsans text-[24px] uppercase text-cocoa lg:text-[40px]">
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
                  className="h-[16px] w-[14px] lg:h-[24px] lg:w-[20px]"
                />
              </button>
            </div>
            <p className="text-center font-parkinsans text-[13px] text-cocoa lg:text-[20px]">
              {pickupDayCopy(pickupDates)}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-[9px] lg:gap-[14px]">
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
        ) : (
          <div className="mt-[32px] flex flex-col items-center gap-[24px] lg:mt-[56px] lg:gap-[36px]">
            <p className="whitespace-nowrap font-parkinsans text-[25px] uppercase text-cocoa lg:text-[40px]">
              {effectiveDateLabel}
            </p>
            <div className="flex flex-col items-center gap-[4px] text-center lg:gap-[8px]">
              <p className="font-parkinsans text-[17px] text-cocoa lg:text-[28px]">
                Choose a time to pick up your order
              </p>
              <p className="font-parkinsans text-[12px] text-latte lg:text-[20px]">
                Times are displayed in the store&rsquo;s local timezone.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-[9px] lg:gap-[14px]">
              {pickupSlots.map((s) => {
                const value = slotValue(s);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelectedTime(value)}
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
        )}
      </section>
    </main>
  );
}
