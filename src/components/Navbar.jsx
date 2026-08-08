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

/* The mobile dropdown (Figma "Dropdown", 283:17136) is its own list, not
   NAV_LINKS: it opens with Home, which the desktop bar deliberately omits (the
   logo is the home link there), and it shortens "Contact Us" to "Contact".
   Labels are lower-cased where the design relies on CSS capitalize. */
const MOBILE_NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "About us", to: "/about" },
  { label: "Menu", to: "/menu" },
  { label: "Inner Crust Club", to: null },
  { label: "Gallery", to: "/gallery" },
  { label: "contact", to: "/contact" },
];

/* Striped bakery background, identical in PageHero/OrderHero so stacked
   sections tile seamlessly. #faf3e0 bands on a #fcf7ea field, both boards
   starting a band at x=0: 80.323px on a 160.646px pitch at 402, 110.769px on a
   221.538px pitch at 1440. */
const STRIPES =
  "bg-[repeating-linear-gradient(90deg,#faf3e0_0px,#faf3e0_80.323px,#fcf7ea_80.323px,#fcf7ea_160.646px)] lg:bg-[repeating-linear-gradient(90deg,#faf3e0_0px,#faf3e0_110.769px,#fcf7ea_110.769px,#fcf7ea_221.538px)]";

const OVERLAY_ROUTES = new Set(["/", "/about", "/menu"]);

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
      <div className="relative mx-auto w-full max-w-[1440px] px-[16px] pt-[19.69px] lg:px-[45px] lg:pt-[44px]">
        {/* The 402 board insets the pill unevenly - 26.25px before the burger,
            9.42px after the cart - so the icon pair sits close to the right
            edge. Desktop is symmetric. */}
        <div className="flex h-[54.84px] items-center justify-between rounded-full border border-shell bg-cream pl-[26.25px] pr-[9.42px] backdrop-blur-[52.5px] lg:h-[76px] lg:px-[28px]">
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

          {/* Figma's link row is 635px wide (247:5057): the five labels measure
              90/56/165/73/111 with 35px between them, which only adds up at
              20px - Parkinsans at 16px comes out 100px short. */}
          <nav className="hidden lg:flex lg:w-[635px] lg:items-center lg:justify-center">
            <div className="flex items-center gap-[35px] font-parkinsans text-[16px] text-cocoa [-webkit-text-stroke:0.2px_#57423d] lg:text-[20px]">
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
              {MOBILE_NAV_LINKS.map(({ label, to }) =>
                to ? (
                  <NavLink
                    key={label}
                    to={to}
                    /* Without `end`, "/" is a prefix of every path and Home
                       would render active on every page. */
                    end={to === "/"}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `px-[32px] py-[8px] font-dm text-[20px] font-medium capitalize leading-[26px] text-espresso ${
                        isActive ? "rounded-[8px] bg-petal" : ""
                      }`
                    }
                  >
                    {label}
                  </NavLink>
                ) : (
                  <span
                    key={label}
                    className="cursor-default px-[32px] py-[8px] font-dm text-[20px] font-medium capitalize leading-[26px] text-espresso"
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
