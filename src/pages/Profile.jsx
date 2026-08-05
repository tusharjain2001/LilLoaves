import { useState } from "react";
import flowerYellow from "../assets/shared/flower-yellow.svg";
import avatarPerson from "../assets/profile/avatar-person.svg";
import avatarEditPen from "../assets/profile/avatar-edit-pen.svg";
import sortChevron from "../assets/profile/sort-chevron.svg";
import orderDeliveredCheck from "../assets/profile/order-delivered-check.svg";
import emptyOrdersIllustration from "../assets/profile/empty-orders-illustration.png";
import emptyOrdersBubble from "../assets/profile/empty-orders-bubble.svg";
import emptyOrdersDotLg from "../assets/profile/empty-orders-dot-lg.svg";
import emptyOrdersDotMd from "../assets/profile/empty-orders-dot-md.svg";
import emptyOrdersDotSm from "../assets/profile/empty-orders-dot-sm.svg";

/* Same seamless stripe pattern as Navbar/PageHero - the hero here is a bespoke
   layout (avatar + "Welcome back" heading + Orders/Profile switcher), so it is
   rebuilt in-page rather than reusing PageHero (see report for details). */
const HERO_STRIPES =
  "bg-[repeating-linear-gradient(90deg,#fcf7ea_0px,#fcf7ea_80px,#faf3e0_80px,#faf3e0_160px)] lg:bg-[repeating-linear-gradient(90deg,#fcf7ea_0px,#fcf7ea_111px,#faf3e0_111px,#faf3e0_222px)]";

const TABS = [
  { key: "orders", label: "Orders" },
  { key: "profile", label: "Profile" },
];

const SAMPLE_ORDERS = [
  {
    id: "order-1",
    qty: "1x",
    item: "Banana Cookies (250gm)",
    status: "Delivered",
    orderedOn: "Ordered: July 11, 6:30pm",
    total: "$23",
  },
  {
    id: "order-2",
    qty: "1x",
    item: "Banana Cookies (250gm)",
    status: "Delivered",
    orderedOn: "Ordered: July 11, 6:30pm",
    total: "$23",
  },
  {
    id: "order-3",
    qty: "1x",
    item: "Banana Cookies (250gm)",
    status: "Delivered",
    orderedOn: "Ordered: July 11, 6:30pm",
    total: "$23",
  },
];

const LABEL_CLASSES = "font-parkinsans text-[14px] text-latte lg:text-[20px] lg:leading-[28px]";

const FIELD_CLASSES =
  "w-full rounded-[7px] border border-[#e9dccf] bg-[#fdfcf8] px-[14px] font-parkinsans text-[13px] text-latte outline-none focus:border-[#d8cbbe] lg:rounded-[10px] lg:px-[18px] lg:text-[16px]";

const PILL_TAG_CLASSES =
  "shrink-0 cursor-pointer whitespace-nowrap rounded-[7px] bg-[#f7ece2] px-[7px] py-[1px] font-parkinsans text-[10px] text-cocoa lg:rounded-[10px] lg:px-[10px] lg:py-[2px] lg:text-[14px] lg:leading-[20px]";

const SECTION_HEADING_CLASSES =
  "w-full font-ligema text-[14.3px] uppercase tracking-[0.7px] text-cocoa lg:text-[20.3px] lg:tracking-[0.95px] lg:leading-[44px]";

function Asterisk() {
  return <span className="text-[#c80000]">*</span>;
}

function MarketingToggle({ checked, onChange }) {
  return (
    <label className="relative inline-flex h-[23px] w-[42px] shrink-0 cursor-pointer items-center rounded-full border border-[#d8cbbe] bg-[#f7ece2] lg:h-[33px] lg:w-[60px]">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span className="pointer-events-none absolute left-[3px] size-[17px] rounded-full bg-[#b1977f] transition-transform duration-150 peer-checked:translate-x-[21px] lg:left-[4px] lg:size-[24px] lg:peer-checked:translate-x-[28px]" />
    </label>
  );
}

function OrderCard({ order }) {
  return (
    <li className="flex w-full flex-col gap-[17px] rounded-[13px] border border-rose bg-rose/15 p-[13px] lg:rounded-[16px] lg:p-[16px]">
      <div className="flex w-full flex-col gap-[17px] lg:flex-row lg:items-start lg:justify-center">
        <div className="flex flex-1 flex-col gap-[17px] lg:gap-[21px]">
          <div className="flex items-center gap-[11px] lg:gap-[14px]">
            <span className="flex w-[37px] shrink-0 items-center justify-center rounded-[7px] bg-[#e5c5bc] px-[8px] py-[4px] font-parkinsans text-[19px] font-medium text-cocoa lg:w-[46px] lg:rounded-[8px] lg:text-[24px] lg:leading-[26px]">
              {order.qty}
            </span>
            <span className="font-parkinsans text-[16px] font-medium text-cocoa lg:text-[20px] lg:leading-[28px]">
              {order.item}
            </span>
          </div>
          <div className="flex items-center gap-[9px] lg:gap-[11px]">
            <span className="font-parkinsans text-[16px] text-cocoa lg:text-[20px] lg:leading-[28px]">
              {order.status}
            </span>
            <img src={orderDeliveredCheck} alt="" className="size-[15px] lg:size-[18px]" />
          </div>
        </div>
        <div className="flex flex-col items-start gap-[17px] lg:w-[397px] lg:items-end lg:gap-[21px]">
          <p className="font-parkinsans text-[16px] text-latte lg:text-[20px] lg:leading-[28px]">
            {order.orderedOn} &bull; Bill Total: <span className="text-taupe">{order.total}</span>
          </p>
          <button
            type="button"
            className="whitespace-nowrap rounded-full border border-taupe px-[30px] py-[6px] font-parkinsans text-[13px] text-taupe lg:border-2 lg:px-[48px] lg:py-[10px] lg:text-[16px] lg:leading-[18px]"
          >
            Reorder
          </button>
        </div>
      </div>
    </li>
  );
}

function EmptyOrders() {
  return (
    <div className="flex w-full flex-col items-center gap-[40px] py-[20px] lg:py-[40px]">
      {/* illustration - mobile */}
      <div className="relative h-[209px] w-[370px] max-w-full lg:hidden">
        <img
          src={emptyOrdersIllustration}
          alt="Illustration of two corgis baking"
          className="absolute left-0 top-[31px] h-[178px] w-[224px] rounded-[10px] object-cover"
        />
        <img src={emptyOrdersBubble} alt="" className="absolute left-[228px] top-0 h-[83px] w-[142px]" />
        <p className="absolute left-[257px] top-[25px] w-[85px] text-center font-parkinsans text-[12px] text-cocoa">
          Wanna order something?
        </p>
        <img src={emptyOrdersDotLg} alt="" className="absolute left-[226px] top-[57px] size-[11px]" />
        <img src={emptyOrdersDotMd} alt="" className="absolute left-[222px] top-[69px] size-[6px]" />
        <img src={emptyOrdersDotSm} alt="" className="absolute left-[216px] top-[76px] size-[4px]" />
      </div>
      {/* illustration - desktop */}
      <div className="relative hidden h-[352px] w-[622px] max-w-full lg:block">
        <img
          src={emptyOrdersIllustration}
          alt="Illustration of two corgis baking"
          className="absolute left-0 top-[52px] h-[300px] w-[377px] rounded-[16px] object-cover"
        />
        <img src={emptyOrdersBubble} alt="" className="absolute left-[384px] top-0 h-[140px] w-[238px]" />
        <p className="absolute left-[432px] top-[42px] w-[142px] text-center font-parkinsans text-[20px] leading-[28px] text-cocoa">
          Wanna order something?
        </p>
        <img src={emptyOrdersDotLg} alt="" className="absolute left-[380px] top-[95px] size-[18px]" />
        <img src={emptyOrdersDotMd} alt="" className="absolute left-[373px] top-[116px] size-[10px]" />
        <img src={emptyOrdersDotSm} alt="" className="absolute left-[363px] top-[128px] size-[6px]" />
      </div>

      <p className="text-center font-parkinsans text-[18px] text-black lg:text-[24px] lg:leading-[34px]">
        No recent orders found in records.
      </p>
      <button
        type="button"
        className="rounded-full bg-taupe px-[42px] py-[9px] font-parkinsans text-[16px] text-white lg:px-[48px] lg:py-[10px] lg:leading-[22px]"
      >
        Order Now
      </button>
    </div>
  );
}

function ProfileInfoSection({ form, onFieldChange }) {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-[16px] pb-[60px] pt-[60px] lg:px-[181px] lg:pb-[76px] lg:pt-[64px]">
      <div className="flex w-full flex-col gap-[45px] lg:gap-[64px]">
        <div className="flex w-full flex-col gap-[24px] lg:gap-[34px]">
          {/* Contact Information */}
          <div className="flex w-full flex-col gap-[6px] lg:gap-[9px]">
            <h2 className={SECTION_HEADING_CLASSES}>Contact Information</h2>
            <div className="flex w-full gap-[20px] lg:gap-[29px]">
              <div className="flex min-w-0 flex-1 flex-col gap-[6px] lg:gap-[9px]">
                <div className="flex w-full items-center justify-between">
                  <label htmlFor="profile-email" className={LABEL_CLASSES}>
                    Email Address <Asterisk />
                  </label>
                  <button type="button" className={PILL_TAG_CLASSES}>
                    Edit
                  </button>
                </div>
                <input
                  id="profile-email"
                  type="email"
                  value={form.email}
                  onChange={onFieldChange("email")}
                  className={`h-[42px] ${FIELD_CLASSES} lg:h-[60px]`}
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-[6px] lg:gap-[9px]">
                <div className="flex w-full items-center justify-between">
                  <label htmlFor="profile-phone" className={LABEL_CLASSES}>
                    Phone Number <Asterisk />
                  </label>
                  <button type="button" className={PILL_TAG_CLASSES}>
                    Edit
                  </button>
                </div>
                <input
                  id="profile-phone"
                  type="tel"
                  value={form.phone}
                  onChange={onFieldChange("phone")}
                  className={`h-[42px] ${FIELD_CLASSES} lg:h-[60px]`}
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="flex w-full flex-col gap-[6px] lg:gap-[9px]">
            <h2 className={SECTION_HEADING_CLASSES}>Address</h2>
            <div className="flex w-full flex-col gap-[6px] lg:gap-[9px]">
              <div className="flex w-full items-center justify-between">
                <label htmlFor="profile-address" className={LABEL_CLASSES}>
                  Saved Address
                  <Asterisk />
                </label>
                <button type="button" className={PILL_TAG_CLASSES}>
                  Add
                </button>
              </div>
              <input
                id="profile-address"
                type="text"
                value={form.address}
                onChange={onFieldChange("address")}
                className={`h-[42px] ${FIELD_CLASSES} lg:h-[60px]`}
              />
            </div>
          </div>

          {/* Marketing preferences - Figma has zero gap here (unlike the 9px
              gap after the other two headings), so the desktop gap is overridden */}
          <div className="flex w-full flex-col gap-[6px] lg:gap-0">
            <h2 className={SECTION_HEADING_CLASSES}>Marketing Preferences</h2>
            <div className="flex h-[42px] w-full items-center justify-between rounded-[7px] border border-[#e9dccf] bg-[#fdfcf8] px-[14px] lg:h-[60px] lg:rounded-[10px] lg:px-[20px]">
              <span className="font-parkinsans text-[12px] text-latte lg:text-[16px]">
                Receive updates via email?
              </span>
              <MarketingToggle checked={form.marketing} onChange={onFieldChange("marketing")} />
            </div>
          </div>
        </div>

        {/* Sign out */}
        <div className="flex items-center gap-[25px] lg:gap-[36px]">
          <button
            type="button"
            className="whitespace-nowrap rounded-full border border-[#e57155] px-[22px] py-[6px] font-parkinsans text-[14px] text-[#e57155] lg:border-2 lg:px-[32px] lg:py-[8px] lg:text-[16px] lg:leading-[18px]"
          >
            Sign Out
          </button>
          <button
            type="button"
            className="whitespace-nowrap font-parkinsans text-[14px] text-[#e57155] underline lg:text-[16px] lg:leading-[22px]"
          >
            Sign out of all Devices
          </button>
        </div>
      </div>
    </section>
  );
}

function OrdersSection({ hasOrders, onToggleDemo }) {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-[16px] py-[60px] lg:px-[181px]">
      <div className="flex w-full flex-col gap-[24px] lg:gap-[46px]">
        {/* Figma's empty-orders design has no "Recent Orders" / "Sort By" row at
            all - only the illustration - so it's omitted here to match, rather
            than just hiding the order list. */}
        {hasOrders && (
          <div className="flex w-full flex-col gap-[16px] lg:flex-row lg:items-center lg:justify-between lg:gap-0">
            <h2 className="font-parkinsans text-[20px] text-cocoa lg:flex-1 lg:text-[32px] lg:leading-[45px]">
              Recent Orders
            </h2>
            <div className="flex items-center gap-[16px]">
              <button
                type="button"
                className="flex items-center gap-[10px] whitespace-nowrap rounded-full border-2 border-cocoa px-[32px] py-[8px] font-parkinsans text-[16px] text-cocoa lg:leading-[18px]"
              >
                Sort By
                <img src={sortChevron} alt="" className="h-[6px] w-[12px]" />
              </button>
              {/* Demo-only control: Figma has no in-app way to reach both the
                  populated and empty Orders designs without a backend, so this
                  unobtrusive toggle exposes both (see report for details). */}
              <button
                type="button"
                onClick={onToggleDemo}
                className="whitespace-nowrap font-parkinsans text-[11px] text-latte underline"
              >
                Preview empty state
              </button>
            </div>
          </div>
        )}

        {hasOrders ? (
          <ul className="flex w-full list-none flex-col gap-[24px]">
            {SAMPLE_ORDERS.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </ul>
        ) : (
          <EmptyOrders />
        )}
      </div>

      {/* Demo-only control (empty state): the header row above - and its
          toggle - doesn't render in the empty state to match Figma, so this
          keeps the populated state reachable again. Sits outside the
          Figma-matched flow so it doesn't affect the section's height. */}
      {!hasOrders && (
        <div className="mt-[16px] flex justify-center lg:mt-[20px] lg:justify-end">
          <button
            type="button"
            onClick={onToggleDemo}
            className="whitespace-nowrap font-parkinsans text-[11px] text-latte underline"
          >
            Preview sample orders
          </button>
        </div>
      )}
    </section>
  );
}

export default function Profile() {
  const [tab, setTab] = useState("profile");
  const [hasOrders, setHasOrders] = useState(true);
  const [form, setForm] = useState({
    email: "moona.fisher@yahoo.com",
    phone: "+1 9839289323",
    address: "3759 Sumner Street, Los Angeles, California,  90045",
    marketing: true,
  });

  const onFieldChange = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const tabPillPadding = tab === "profile" ? "pl-[32px] pr-[8px]" : "pl-[8px] pr-[32px]";

  return (
    <main className="w-full bg-cream">
      {/* Hero band is 405px in Figma with the navbar drawn inside it; the navbar
          renders above this in normal flow, so the band here is 405-120=285. */}
      <section className={`relative w-full overflow-hidden ${HERO_STRIPES}`}>
        <div className="relative mx-auto h-[477px] w-full max-w-[1440px] lg:h-[285px]">
          {/* flowers - mobile */}
          <img src={flowerYellow} alt="" className="absolute left-[-17px] top-[82px] h-[72px] w-[79px] lg:hidden" />
          <img src={flowerYellow} alt="" className="absolute right-[-23px] top-[271px] h-[72px] w-[79px] lg:hidden" />
          <img src={flowerYellow} alt="" className="absolute left-[110px] top-[430px] h-[72px] w-[79px] lg:hidden" />
          {/* flowers - desktop */}
          <img src={flowerYellow} alt="" className="absolute left-[110px] top-[51px] hidden h-[72px] w-[79px] lg:block" />
          <img src={flowerYellow} alt="" className="absolute right-[13px] top-[51px] hidden h-[72px] w-[79px] lg:block" />
          <img src={flowerYellow} alt="" className="absolute left-[321px] top-[155px] hidden h-[72px] w-[79px] lg:block" />
          <img src={flowerYellow} alt="" className="absolute right-[242px] top-[155px] hidden h-[72px] w-[79px] lg:block" />

          <div className="relative flex h-full flex-col items-center justify-center gap-[47px] px-[16px] lg:flex-row lg:items-center lg:justify-between lg:gap-0 lg:px-[74px]">
            {/* Avatar */}
            <div className="relative size-[113px] shrink-0 rounded-full bg-white lg:order-2">
              <img src={avatarPerson} alt="" className="absolute inset-[8.33%] size-[83.34%]" />
              <span className="absolute left-[80px] top-[82px] flex size-[23px] items-center justify-center rounded-[12px] border border-white bg-[#fff5f2]">
                <img src={avatarEditPen} alt="Edit profile photo" className="size-[13px]" />
              </span>
            </div>

            {/* Heading + tab switcher */}
            <div className="flex flex-col items-center gap-[17px] lg:order-1 lg:w-[559px] lg:items-start">
              <h1 className="text-center font-parkinsans text-[24px] text-black lg:text-left lg:text-[44px] lg:leading-[69px]">
                Welcome back, Moona
              </h1>
              <div
                className={`flex items-center gap-[16px] rounded-full border border-taupe bg-vanilla py-[8px] ${tabPillPadding}`}
              >
                {TABS.map(({ key, label }) => {
                  const active = tab === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTab(key)}
                      className={
                        active
                          ? "whitespace-nowrap rounded-full bg-taupe px-[16px] py-[8px] font-parkinsans text-[16px] text-white"
                          : "whitespace-nowrap font-parkinsans text-[16px] text-cocoa"
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {tab === "profile" ? (
        <ProfileInfoSection form={form} onFieldChange={onFieldChange} />
      ) : (
        <OrdersSection hasOrders={hasOrders} onToggleDemo={() => setHasOrders((v) => !v)} />
      )}
    </main>
  );
}
