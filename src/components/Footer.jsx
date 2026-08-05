import { Link } from "react-router-dom";
import logoWhite from "../assets/shared/logo-latte-white.svg";
import iconEmail from "../assets/shared/icon-email.svg";
import iconFacebook from "../assets/shared/icon-facebook.svg";
import iconInstagram from "../assets/shared/icon-instagram.svg";
import mapFooter from "../assets/shared/map-footer.jpg";

const BAKERY_LINKS = [
  { label: "Home", to: "/" },
  { label: "About Us", to: "/about" },
  { label: "Menu", to: "/menu" },
  { label: "Gallery", to: "/gallery" },
];

const QUICK_LINKS = [
  { label: "Profile", to: "/profile" },
  { label: "Orders", to: "/profile" },
  { label: "Contact Us", to: "/contact" },
  { label: "Refunds & Returns", to: null },
];

export default function Footer() {
  return (
    <footer className="w-full bg-mocha">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center px-[16px] pt-[60px] lg:flex-row lg:items-start lg:justify-between lg:px-[65px] lg:pt-[66px] lg:pb-[60px]">
        <div className="flex flex-col items-center gap-[36px] lg:items-start">
          <img
            src={logoWhite}
            alt="Lil' Loaves"
            className="h-[74px] w-[76px]"
          />
          <div className="flex items-center gap-[12px]">
            <img src={iconEmail} alt="" className="h-[28px] w-[28px]" />
            <p className="font-dm text-[20px] leading-[32px] text-white">
              example@lilloaves.com
            </p>
          </div>
        </div>

        <div className="mt-[40px] flex flex-col gap-[9px] lg:order-last lg:mt-0">
          <p className="font-parkinsans text-[20px] text-white">
            📍 Find us here
          </p>
          <img
            src={mapFooter}
            alt="Map of Lil' Loaves pickup locations"
            className="h-[154px] w-[262px] rounded-[16px] object-cover lg:h-[196px] lg:w-[321px]"
          />
        </div>

        <div className="mt-[40px] flex gap-[69px] lg:mt-[75px] lg:gap-[58px]">
          <div className="flex flex-col gap-[16px] text-white">
            <p className="font-dm text-[16px] font-bold leading-[21px] lg:text-[20px] lg:leading-[26px]">
              Bakery
            </p>
            <ul className="flex flex-col gap-[8px] font-dm text-[14px] leading-[18px] lg:text-[18px] lg:leading-[23px]">
              {BAKERY_LINKS.map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-[16px] text-white">
            <p className="font-dm text-[16px] font-bold leading-[21px] lg:text-[20px] lg:leading-[26px]">
              Quick Links
            </p>
            <ul className="flex flex-col gap-[8px] font-dm text-[14px] leading-[18px] lg:text-[18px] lg:leading-[23px]">
              {QUICK_LINKS.map(({ label, to }) =>
                to ? (
                  <li key={label}>
                    <Link to={to} className="hover:underline">
                      {label}
                    </Link>
                  </li>
                ) : (
                  <li key={label}>
                    <span className="cursor-default">{label}</span>
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-[40px] w-full max-w-[1440px] lg:mt-0">
        <div className="mx-auto h-px w-[calc(100%-75px)] max-w-[1365px] bg-white" />
        <div className="flex flex-col items-center gap-[22px] px-[16px] py-[28px] lg:flex-row lg:justify-between lg:px-[64px] lg:py-[27.5px]">
          <div className="flex items-center gap-[12px]">
            <a href="https://www.facebook.com" aria-label="Facebook">
              <img
                src={iconFacebook}
                alt=""
                className="h-[25px] w-[25px] lg:h-[44px] lg:w-[44px]"
              />
            </a>
            <a href="https://www.instagram.com" aria-label="Instagram">
              <img
                src={iconInstagram}
                alt=""
                className="h-[25px] w-[25px] lg:h-[44px] lg:w-[44px]"
              />
            </a>
          </div>
          <div className="flex items-center gap-[24px] font-dm leading-[20px] text-white">
            <span className="hidden items-center gap-[8px] lg:flex">
              <span className="h-[4px] w-[4px] rounded-full bg-white" />
              <span className="cursor-default text-[20px]">
                Terms of Service
              </span>
            </span>
            <span className="hidden items-center gap-[8px] lg:flex">
              <span className="h-[4px] w-[4px] rounded-full bg-white" />
              <span className="cursor-default text-[20px]">Privacy Policy</span>
            </span>
            <p className="text-[14px] lg:text-[20px]">
              © 2026 Lil’ Loaves Bakery. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
