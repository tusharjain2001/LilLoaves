import headerWave from "../assets/email-pickup/header-wave.svg";
import flowerBlush from "../assets/email-pickup/flower-blush.svg";
import iconEmail from "../assets/email-pickup/icon-email.svg";

const pickupSlots = [
  {
    label: "Pickup DATES",
    value: "2 Aug, Sunday",
    cardPadding: "p-[8px]",
    pillBg: "bg-[rgba(239,216,149,0.52)]",
  },
  {
    label: "Pickup TIME",
    value: "2:30 PM – 3:00 PM",
    cardPadding: "px-[16px] py-[8px]",
    pillBg: "bg-[#f4e4b7]",
  },
];

const orderItems = [
  "Sourdough × 1",
  "Blueberry Muffins × 1",
  "Doc's Cheddar Crackers × 1",
];

export default function EmailPickup() {
  return (
    <main className="flex min-h-screen w-full items-start justify-center bg-oat px-[16px] py-[48px]">
      <div className="relative w-full max-w-[650px] overflow-hidden rounded-[16px] bg-vanilla pb-[33px]">
        <img
          src={headerWave}
          alt=""
          className="pointer-events-none absolute top-[-35px] left-[calc(50%+72.12px)] h-[237.436px] w-[1252.246px] max-w-none -translate-x-1/2"
        />

        <div className="relative mt-[78px] flex items-end justify-center gap-[28px]">
          <img src={flowerBlush} alt="" className="h-[71.88px] w-[79.413px] shrink-0" />
          <p className="font-ligema text-[30.4px] leading-[normal] whitespace-nowrap text-cocoa">
            <span className="font-script">Thank You,</span> MOONA!
          </p>
          <img src={flowerBlush} alt="" className="h-[71.88px] w-[79.413px] shrink-0" />
        </div>

        <div className="relative mx-auto mt-[92px] flex w-full flex-col gap-[48px] px-[25px]">
          <div className="flex w-full flex-col gap-[43px]">
            <div className="flex w-full flex-col gap-[8px] text-center leading-[normal]">
              <p className="font-parkinsans text-[20px] font-medium text-cocoa">
                Pick Up Confirmed! See you soon.
              </p>
              <p className="font-parkinsans text-[12px] font-normal text-clay">
                {"Thank you for supporting our family bakery. We can't wait to welcome you and share our handcrafted bakes with you."}
              </p>
            </div>

            <div className="flex w-full flex-col gap-[17px]">
              <div className="flex w-full flex-col gap-[4px] rounded-[16px] bg-[#f9f1db] px-[16px] py-[8px] text-center text-cocoa">
                <p className="font-ligema text-[17.1px] leading-[normal] uppercase">
                  Pickup Details
                </p>
                <p className="font-parkinsans text-[17px] font-normal leading-[normal]">
                  Orange County Store
                </p>
              </div>
              <div className="flex w-full items-center justify-between">
                {pickupSlots.map((slot) => (
                  <div
                    key={slot.label}
                    className={`flex w-[48.5%] flex-col gap-[4px] rounded-[16px] border border-solid border-[rgba(239,216,149,0.75)] ${slot.cardPadding}`}
                  >
                    <p className="w-full text-center font-ligema text-[17.1px] leading-[normal] uppercase text-cocoa">
                      {slot.label}
                    </p>
                    <div
                      className={`flex w-full items-center justify-center rounded-[16px] py-[4px] ${slot.pillBg}`}
                    >
                      <p className="text-center font-parkinsans text-[17px] font-normal leading-[normal] text-cocoa">
                        {slot.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex w-full flex-col items-center gap-[17px] rounded-[16px] bg-rose/48 py-[32px]">
              <p className="w-full text-center font-ligema text-[17.1px] leading-[normal] uppercase text-cocoa">
                Order Summary
              </p>
              <div className="flex w-full flex-col items-center gap-[24px]">
                <div className="w-full text-center font-parkinsans text-[17px] font-normal text-cocoa">
                  {orderItems.map((item) => (
                    <p key={item} className="leading-[normal]">
                      {item}
                    </p>
                  ))}
                </div>
                <div className="flex items-center justify-center rounded-[100px] border-2 border-solid border-[#e5c5bc] px-[31px] py-[8px]">
                  <p className="font-parkinsans text-[17px] font-medium leading-[normal] whitespace-nowrap text-cocoa">
                    Total: $39.00
                  </p>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-[19px] text-center leading-[normal]">
              <p className="font-parkinsans text-[12px] font-normal text-clay">
                Before You Arrive*
                <br />
                Please bring your order confirmation or order number when collecting your order
              </p>
              <p className="font-parkinsans text-[17px] font-semibold text-cocoa">
                Order #: LL-10324
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col items-center gap-[38px]">
            <div className="flex w-full flex-col gap-[8px] text-center leading-[normal]">
              <p className="font-parkinsans text-[14px] font-normal text-latte">
                From our table to yours, one hand-shaped loaf at a time.
              </p>
              <p className="font-parkinsans text-[17px] font-semibold text-cocoa">
                {"\u{1f9e1} The Lil' Loaves Family"}
              </p>
            </div>
            <div className="flex w-full max-w-[301px] flex-col items-center rounded-[100px] bg-[#f9f0e4] px-[28px] py-[8px]">
              <div className="flex w-full items-center justify-center gap-[5px]">
                <img src={iconEmail} alt="" className="size-[16px] shrink-0" />
                <p className="w-[192px] text-center font-parkinsans text-[14px] font-normal leading-[normal] text-[#b5796b] underline decoration-solid [text-underline-position:from-font]">
                  hello@lilloavesbakery.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
