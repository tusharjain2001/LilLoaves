import { Link } from "react-router-dom";
import flowerYellow from "../assets/shared/flower-yellow.svg";
import waveHero from "../assets/shared/wave-hero.svg";
import iconBack from "../assets/shared/icon-back.svg";

const STEPS = ["Shipping", "Payment", "Review"];

/* Same seamless stripe pattern as Navbar - the two sections stack flush. */
const STRIPES =
  "bg-[repeating-linear-gradient(90deg,#fcf7ea_0px,#fcf7ea_80px,#faf3e0_80px,#faf3e0_160px)] lg:bg-[repeating-linear-gradient(90deg,#fcf7ea_0px,#fcf7ea_111px,#faf3e0_111px,#faf3e0_222px)]";

export default function OrderHero({
  mode = "delivery",
  title = "YOUR CART",
  subtitle = "Review your cart items to place an order.",
  step = null,
  stepper = null,
}) {
  const deliveryActive = mode === "delivery";

  const stepperNode =
    stepper ??
    (step !== null ? (
      <div className="flex items-center gap-[16px] lg:gap-[27px]">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-[8px] lg:gap-[15px]">
            <span
              className={`grid h-[29px] w-[29px] place-items-center rounded-full font-ligema text-[7.1px] lg:h-[32px] lg:w-[32px] lg:text-[8.1px] ${
                i + 1 === step ? "bg-cocoa text-white" : "bg-cream text-cocoa"
              }`}
            >
              {i + 1}
            </span>
            <span className="font-parkinsans text-[15px] text-cocoa lg:text-[17px]">
              {label}
            </span>
          </div>
        ))}
      </div>
    ) : null);

  return (
    <section className="w-full">
      <div className={`w-full overflow-hidden ${STRIPES}`}>
        <div className="relative mx-auto h-[519px] w-full max-w-[1440px] lg:h-[394px]">
          {/* cream wave */}
          <img
            src={waveHero}
            alt=""
            className="absolute left-1/2 top-[64px] h-[367px] w-[612px] max-w-none -translate-x-1/2 lg:top-[63px] lg:h-[253px] lg:w-[1554px]"
          />

          {/* flowers */}
          <img
            src={flowerYellow}
            alt=""
            className="absolute left-[261px] top-[36px] h-[72px] w-[79px] lg:left-[275px] lg:top-[154px]"
          />
          <img
            src={flowerYellow}
            alt=""
            className="absolute left-[44px] top-[395px] h-[72px] w-[79px] lg:left-auto lg:right-[276px] lg:top-[154px]"
          />

          {/* mobile-only Continue Shopping (desktop version lives in the sub-bar) */}
          <Link
            to="/menu"
            className="absolute left-1/2 top-[60px] flex -translate-x-1/2 items-center gap-[15px] lg:hidden"
          >
            <img src={iconBack} alt="" className="h-[22px] w-[11px]" />
            <span className="whitespace-nowrap font-parkinsans text-[16px] text-cocoa">
              Continue Shopping
            </span>
          </Link>

          {/* centered heading + delivery/pickup toggle */}
          <div className="absolute left-1/2 top-[197px] flex w-[329px] -translate-x-1/2 flex-col items-center gap-[28px] lg:top-[114px]">
            <div className="flex w-full flex-col items-center gap-[6px] text-center">
              <h1 className="font-ligema text-[22.8px] uppercase leading-[19px] text-cocoa">
                {title}
              </h1>
              <p className="font-parkinsans text-[16px] text-latte">
                {subtitle}
              </p>
            </div>
            <div
              className={`flex items-center gap-[16px] rounded-full border border-taupe bg-vanilla py-[8px] ${
                deliveryActive ? "pl-[8px] pr-[32px]" : "pl-[32px] pr-[8px]"
              }`}
            >
              {deliveryActive ? (
                <>
                  <span className="rounded-full bg-taupe px-[16px] py-[8px] font-parkinsans text-[16px] text-white">
                    Delivery
                  </span>
                  <Link
                    to="/pickup"
                    className="font-parkinsans text-[16px] text-taupe"
                  >
                    Pickup
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/cart"
                    className="font-parkinsans text-[16px] text-taupe"
                  >
                    Delivery
                  </Link>
                  <span className="rounded-full bg-taupe px-[16px] py-[8px] font-parkinsans text-[16px] text-white">
                    Pickup
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 70px sub-bar: back-link (desktop) + optional checkout stepper */}
      <div
        className={`w-full bg-rose ${stepperNode ? "block" : "hidden lg:block"}`}
      >
        <div
          className={`mx-auto h-[61px] w-full max-w-[1440px] items-center justify-center lg:flex lg:h-[70px] lg:justify-between lg:px-[72px] ${
            stepperNode ? "flex" : "hidden lg:flex"
          }`}
        >
          <Link
            to="/menu"
            className="hidden items-center gap-[15px] lg:flex"
          >
            <img src={iconBack} alt="" className="h-[22px] w-[11px]" />
            <span className="font-parkinsans text-[16px] text-cocoa">
              Continue Shopping
            </span>
          </Link>
          {stepperNode}
        </div>
      </div>
    </section>
  );
}
