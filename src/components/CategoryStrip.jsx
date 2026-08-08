import { Fragment } from "react";

const CATEGORIES = ["Breads", "Crackers", "Cookies", "Muffins"];

export default function CategoryStrip() {
  return (
    <div className="flex h-[64px] w-full items-center justify-center gap-[36.5px] overflow-hidden whitespace-nowrap bg-oat lg:h-[76px] lg:gap-[44px]">
      {CATEGORIES.map((category, i) => (
        <Fragment key={category}>
          {/* Figma sets the separators in Neulis Sans, not Parkinsans like the
              labels; DM Sans is our stand-in for it. */}
          {i > 0 && (
            <span className="shrink-0 font-dm text-[16px] text-clay lg:text-[20px]">
              / /
            </span>
          )}
          <span className="shrink-0 font-parkinsans text-[16px] text-cocoa lg:text-[20px]">
            {category}
          </span>
        </Fragment>
      ))}
    </div>
  );
}
