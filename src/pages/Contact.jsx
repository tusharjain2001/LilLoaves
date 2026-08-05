import { useState } from "react";
import PageHero from "../components/PageHero.jsx";
import chevronDown from "../assets/contact/chevron-down.svg";

const NAME_FIELDS = [
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
];

const REASON_OPTIONS = [
  "General Inquiry",
  "Custom Order",
  "Catering",
  "Feedback",
  "Other",
];

const INITIAL_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  reason: "",
  message: "",
  agree: false,
};

const LABEL_CLASSES =
  "font-parkinsans text-[13px] text-latte lg:text-[20px]";

const FIELD_CLASSES =
  "w-full rounded-[6px] border border-[#e9dccf] bg-[#fdfcf8] px-[14px] font-parkinsans text-[13px] text-cocoa outline-none focus:border-[#d8cbbe] lg:rounded-[10px] lg:px-[20px] lg:text-[20px]";

function Asterisk() {
  return <span className="text-[#c80000]">*</span>;
}

export default function Contact() {
  const [form, setForm] = useState(INITIAL_FORM);

  const update = (key) => (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <main className="w-full bg-cream">
      <PageHero title="Contact Us" />

      <section className="mx-auto w-full max-w-[1440px] px-[16px] pb-[60px] pt-[60px] lg:px-[181px] lg:pb-[180px] lg:pt-[83px]">
        <div className="w-full rounded-[10px] border border-[#d8cbbe] bg-[#f7f5f1] px-[16px] pb-[15px] pt-[33px] lg:rounded-[16px] lg:px-[47px] lg:pb-[29px] lg:pt-[52px]">
          <h2 className="font-parkinsans text-[18px] font-medium capitalize text-cocoa lg:text-[28px]">
            Get in Touch with us
          </h2>

          <form
            onSubmit={handleSubmit}
            className="mt-[27px] flex w-full flex-col items-end gap-[27px] lg:mt-[42px] lg:gap-[42px]"
          >
            <div className="flex w-full flex-col gap-[24px] lg:gap-[38px]">
              <div className="flex w-full flex-col gap-[6px]">
                <div className="flex w-full flex-col gap-[15px] lg:gap-[24px]">
                  {/* First / Last name row */}
                  <div className="flex w-full gap-[19px] lg:gap-[29px]">
                    {NAME_FIELDS.map(({ key, label }) => (
                      <div
                        key={key}
                        className="flex min-w-0 flex-1 flex-col gap-[1px] lg:gap-[2px]"
                      >
                        <label
                          htmlFor={`contact-${key}`}
                          className={`whitespace-nowrap ${LABEL_CLASSES}`}
                        >
                          {label} <Asterisk />
                        </label>
                        <input
                          id={`contact-${key}`}
                          type="text"
                          value={form[key]}
                          onChange={update(key)}
                          className={`h-[39px] ${FIELD_CLASSES} lg:h-[60px]`}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Email */}
                  <div className="flex w-full flex-col gap-[1px] lg:gap-[2px]">
                    <label htmlFor="contact-email" className={LABEL_CLASSES}>
                      Email ID <Asterisk />
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={form.email}
                      onChange={update("email")}
                      className={`h-[39px] ${FIELD_CLASSES} lg:h-[60px]`}
                    />
                  </div>

                  {/* Reason for Contact */}
                  <div className="flex w-full flex-col gap-[1px] lg:gap-[2px]">
                    <label htmlFor="contact-reason" className={LABEL_CLASSES}>
                      Reason for Contact <Asterisk />
                    </label>
                    <div className="relative w-full">
                      <select
                        id="contact-reason"
                        value={form.reason}
                        onChange={update("reason")}
                        className={`h-[39px] appearance-none ${FIELD_CLASSES} lg:h-[60px]`}
                      >
                        <option value="" hidden></option>
                        {REASON_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <img
                        src={chevronDown}
                        alt=""
                        className="pointer-events-none absolute right-[28px] top-1/2 hidden h-[9px] w-[18px] -translate-y-1/2 lg:block"
                      />
                    </div>
                  </div>

                  {/* Write a Message */}
                  <div className="flex w-full flex-col gap-[1px] lg:gap-[2px]">
                    <label htmlFor="contact-message" className={LABEL_CLASSES}>
                      Write a Message <Asterisk />
                    </label>
                    <div className="relative w-full">
                      <textarea
                        id="contact-message"
                        value={form.message}
                        onChange={update("message")}
                        className={`h-[87px] resize-none py-[10px] ${FIELD_CLASSES} lg:h-[135px] lg:py-[16px]`}
                      />
                      <img
                        src={chevronDown}
                        alt=""
                        className="pointer-events-none absolute right-[28px] top-[32px] hidden h-[9px] w-[18px] lg:block"
                      />
                    </div>
                  </div>
                </div>

                {/* Desktop-only mandatory note (absent in the mobile design) */}
                <p className="hidden font-parkinsans text-[17px] text-[#c80000] lg:block">
                  Fields marked * are mandatory
                </p>
              </div>

              {/* Consent checkbox */}
              <label
                htmlFor="contact-agree"
                className="flex w-full cursor-pointer items-center gap-[9px] lg:gap-[14px]"
              >
                <input
                  id="contact-agree"
                  type="checkbox"
                  checked={form.agree}
                  onChange={update("agree")}
                  className="size-[15px] shrink-0 cursor-pointer appearance-none rounded-[4px] border border-[#c7c7c7] bg-[#f7f7f7] checked:border-cocoa checked:bg-cocoa lg:size-[23px]"
                />
                <span className="font-parkinsans text-[13px] text-latte lg:text-[20px]">
                  I agree to be contacted regarding my inquiry.
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="cursor-pointer whitespace-nowrap rounded-full bg-cocoa px-[21px] py-[6px] font-parkinsans text-[13px] capitalize text-white lg:px-[32px] lg:py-[10px] lg:text-[16px]"
            >
              send Message
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
