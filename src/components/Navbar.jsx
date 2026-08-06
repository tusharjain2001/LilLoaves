import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import logo from "../assets/shared/logo-latte.svg";
import iconSearch from "../assets/shared/icon-search.svg";
import iconPerson from "../assets/shared/icon-person.svg";
import iconCart from "../assets/shared/icon-cart.svg";
import iconHamburger from "../assets/shared/icon-hamburger.svg";

const NAV_LINKS = [
  { label: "About us", to: "/about" },
  { label: "Menu", to: "/menu" },
  { label: "Inner Crust Club", to: null },
  { label: "Gallery", to: "/gallery" },
  { label: "Contact Us", to: "/contact" },
];

/* Striped bakery background: #fcf7ea stripes over #faf3e0 base.
   80px period on mobile, 111px on desktop - identical in PageHero/OrderHero
   so stacked sections tile seamlessly. */
const STRIPES =
  "bg-[repeating-linear-gradient(90deg,#fcf7ea_0px,#fcf7ea_80px,#faf3e0_80px,#faf3e0_160px)] lg:bg-[repeating-linear-gradient(90deg,#fcf7ea_0px,#fcf7ea_111px,#faf3e0_111px,#faf3e0_222px)]";

const OVERLAY_ROUTES = new Set(["/", "/about"]);

export default function Navbar() {
  const [open, setOpen] = useState(false);
  /* On these pages the pill floats over the hero itself (Figma runs the hero
     full-bleed from y=0 with the nav laid on top at y=44); every other page
     sits it on the striped band. */
  const overlay = OVERLAY_ROUTES.has(useLocation().pathname);

  return (
    <header
      className={
        overlay
          ? "absolute inset-x-0 top-0 z-50 w-full"
          : `w-full ${STRIPES}`
      }
    >
      <div className="relative mx-auto w-full max-w-[1440px] px-[16px] pt-[20px] lg:px-[45px] lg:pt-[44px]">
        <div className="flex h-[55px] items-center justify-between rounded-full border border-shell bg-cream px-[26px] backdrop-blur-[52.5px] lg:h-[76px] lg:px-[28px]">
          <div className="flex items-center gap-[16px]">
            <button
              type="button"
              aria-label="Toggle navigation menu"
              className="lg:hidden"
              onClick={() => setOpen((v) => !v)}
            >
              <img src={iconHamburger} alt="" className="h-[23px] w-[23px]" />
            </button>
            <Link to="/" aria-label="Lil' Loaves home">
              <img
                src={logo}
                alt="Lil' Loaves"
                className="h-[34px] w-[35px] lg:h-[44px] lg:w-[45px]"
              />
            </Link>
          </div>

          <nav className="hidden lg:flex lg:w-[629px] lg:items-center lg:justify-center">
            <div className="flex items-center gap-[35px] font-parkinsans text-[16px] text-cocoa [-webkit-text-stroke:0.2px_#57423d]">
              {NAV_LINKS.map(({ label, to }) =>
                to ? (
                  <NavLink
                    key={label}
                    to={to}
                    className={({ isActive }) =>
                      `whitespace-nowrap ${
                        isActive
                          ? "underline underline-offset-4"
                          : "hover:underline hover:underline-offset-4"
                      }`
                    }
                  >
                    {label}
                  </NavLink>
                ) : (
                  <span key={label} className="cursor-default whitespace-nowrap">
                    {label}
                  </span>
                ),
              )}
            </div>
          </nav>

          <div className="flex items-center gap-[9px] lg:gap-[16px]">
            <button
              type="button"
              aria-label="Search"
              className="hidden h-[36px] w-[36px] place-items-center rounded-full bg-blush lg:grid"
            >
              <img src={iconSearch} alt="" className="h-[20px] w-[20px]" />
            </button>
            <Link
              to="/profile"
              aria-label="Profile"
              className="grid h-[36px] w-[36px] place-items-center rounded-full bg-blush"
            >
              <img src={iconPerson} alt="" className="h-[20px] w-[20px]" />
            </Link>
            <Link
              to="/cart"
              aria-label="Cart"
              className="grid h-[35px] w-[35px] place-items-center rounded-full bg-blush lg:h-[36px] lg:w-[36px]"
            >
              <img
                src={iconCart}
                alt=""
                className="h-[21px] w-[21px] lg:h-[18px] lg:w-[18px]"
              />
            </Link>
          </div>
        </div>

        {open && (
          <div className="absolute left-[16px] top-[80px] z-50 w-[261px] rounded-[8px] bg-cream px-[16px] py-[24px] lg:hidden">
            <nav className="flex w-full flex-col">
              {NAV_LINKS.map(({ label, to }) =>
                to ? (
                  <NavLink
                    key={label}
                    to={to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `px-[32px] py-[8px] font-dm text-[24px] font-medium capitalize text-espresso ${
                        isActive ? "rounded-[8px] bg-petal" : ""
                      }`
                    }
                  >
                    {label}
                  </NavLink>
                ) : (
                  <span
                    key={label}
                    className="cursor-default px-[32px] py-[8px] font-dm text-[24px] font-medium capitalize text-espresso"
                  >
                    {label}
                  </span>
                ),
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
