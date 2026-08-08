import { useState } from "react";
import iconCross from "../assets/home/icon-cross.svg";
import iconPlus from "../assets/home/icon-plus.svg";

/* Shared by the Home and Menu pages - Figma draws the identical 798px section
   on both (Home 247:11550, Menu 279:17091). */
const FAQS = [
  {
    q: "Do you bake everything fresh?",
    a: "Yes! Every loaf and baked good is handcrafted in small batches using quality ingredients and traditional baking methods.",
  },
  { q: "Do you offer seasonal specials?" },
  { q: "How do I place an order?" },
  { q: "Can I customize my Lunch Box Special?" },
  { q: "Do you use preservatives?" },
  { q: "How can I stay updated on new products?" },
];

/* Two things keep a collapsed row at Figma's 71px: the vertical padding lives on
   the text column rather than the row (otherwise it stacks with the 71px toggle
   icon and every row grows to 119px), and the rule is painted on the bottom edge
   instead of being a border, since Figma's stroke sits inside the frame. */
function FaqRow({ item, isOpen, onToggle }) {
  return (
    <div className="relative w-full">
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-clay" />
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-[8.34px] text-left lg:gap-[12px]"
      >
        <div
          className={`flex flex-1 flex-col gap-[8.34px] py-[16.69px] lg:gap-[12px] lg:py-[24px] ${
            /* Figma indents the collapsed rows - 6.95px on mobile, 10px on
               desktop; the open one sits flush. */
            isOpen ? "" : "pl-[6.95px] lg:pl-[10px]"
          }`}
        >
          <p className="font-parkinsans text-[16.69px] capitalize leading-[15.92px] tracking-[-0.167px] text-cocoa lg:text-[20px] lg:leading-[22.9px] lg:tracking-[-0.2px]">
            {item.q}
          </p>
          {isOpen && item.a && (
            <p className="font-parkinsans text-[13.86px] capitalize leading-[19.4px] text-cocoa lg:w-[892px] lg:text-[16px] lg:leading-[22px]">
              {item.a}
            </p>
          )}
        </div>
        <img
          src={isOpen ? iconCross : iconPlus}
          alt=""
          className="size-[49.37px] shrink-0 lg:size-[71px]"
        />
      </button>
    </div>
  );
}

export default function FaqSection() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <section className="w-full bg-linen px-[16px] py-[60px] lg:h-[798px] lg:px-[70px] lg:py-0 lg:pt-[83px]">
      <div className="mx-auto flex w-full max-w-[1302px] flex-col items-start gap-[21.56px] lg:gap-[31px]">
        <p className="font-parkinsans text-[19.47px] leading-[27px] text-cocoa lg:text-[28px] lg:leading-[39px]">
          Frequently asked questions
        </p>
        <div className="flex w-full flex-col gap-[11.13px] lg:gap-[16px]">
          {FAQS.map((item, i) => (
            <FaqRow
              key={item.q}
              item={item}
              isOpen={openFaq === i}
              onToggle={() => setOpenFaq((cur) => (cur === i ? null : i))}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
