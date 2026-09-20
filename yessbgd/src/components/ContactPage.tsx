"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Navigation,
  Building2,
} from "lucide-react";
import { PageHero } from "@/components/PageHero";
import {
  submitContactFormAction,
  type ContactFormState,
} from "@/actions/public";
import { COMPANY_CONTACT, phoneHref } from "@/lib/companyContact";
import { useSettingText } from "@/lib/siteContent";
import { toMapEmbedSrc } from "@/lib/mapEmbed";

const initialState: ContactFormState = { ok: false };

export function ContactPage() {
  const { t } = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    submitContactFormAction,
    initialState
  );
  const [showSuccess, setShowSuccess] = useState(false);
  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.ok) {
      setShowSuccess(true);
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <>
      <PageHero
        page="contact"
        eyebrow={t("pages.contact.eyebrow")}
        title={t("pages.contact.title")}
        subtitle={t("pages.contact.subtitle")}
      />

      <section className="py-16 md:py-20">
        <div className="container-tight grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl glass-card p-5 shadow-sm">
              <div className="flex gap-4">
                <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Head Office
                  </div>
                  <div className="mt-1 text-sm font-medium leading-relaxed">
                    {COMPANY_CONTACT.office}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent("YESS Bangla, Green View, House 127, Road 3, Block A, Mirpur 12, Dhaka 1216, Bangladesh")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15"
                    >
                      <Navigation className="h-3.5 w-3.5" /> Get directions
                    </a>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Green View House 127 Road 3 Block A Mirpur 12 Dhaka 1216")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-primary hover:border-primary"
                    >
                      Open in Maps
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl glass-card p-5 shadow-sm">
              <div className="flex gap-4">
                <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Corporate Office
                  </div>
                  <div className="mt-1 text-sm font-medium leading-relaxed">
                    {COMPANY_CONTACT.corporateOffice}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl glass-card p-5 shadow-sm">
              <div className="flex gap-4">
                <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Phone
                  </div>
                  <a
                    href={phoneHref}
                    className="mt-1 block text-sm font-medium hover:text-primary"
                  >
                    {COMPANY_CONTACT.phone.display}
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-2xl glass-card p-5 shadow-sm">
              <div className="flex gap-4">
                <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Email
                  </div>
                  <a
                    href={`mailto:${COMPANY_CONTACT.email}`}
                    className="mt-1 block text-sm font-medium hover:text-primary"
                  >
                    {COMPANY_CONTACT.email}
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-2xl glass-card p-5 shadow-sm">
              <div className="flex gap-4">
                <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Hours
                  </div>
                  <div className="mt-1 text-sm font-medium">
                    Sat–Thu · 10:00–18:00
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form
            ref={formRef}
            action={formAction}
            noValidate
            className="lg:col-span-3 rounded-2xl glass-card p-6 shadow-sm md:p-8"
          >
            <h2 className="font-display text-xl font-semibold">
              Send us a message
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              We typically reply within one business day.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field
                label="Full name *"
                name="name"
                required
                error={errors.name}
                maxLength={100}
                autoComplete="name"
              />
              <Field
                label="Email *"
                name="email"
                type="email"
                required
                error={errors.email}
                maxLength={255}
                autoComplete="email"
              />
              <Field
                label="Phone"
                name="phone"
                type="tel"
                error={errors.phone}
                maxLength={30}
                autoComplete="tel"
              />
              <Field
                label="Subject"
                name="subject"
                error={errors.subject}
                maxLength={150}
              />
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium" htmlFor="message">
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                maxLength={5000}
                placeholder="Tell us about your project…"
                className={inputClass(!!errors.message) + " mt-1.5 min-h-[140px] resize-y"}
              />
              {errors.message && (
                <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" /> {errors.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={pending}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background shadow-md transition-transform hover:scale-[1.03] disabled:opacity-60 disabled:hover:scale-100"
            >
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Send message
                </>
              )}
            </button>

            {showSuccess && state.ok && (
              <p
                role="status"
                className="mt-4 inline-flex items-start gap-2 rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                Thank you — your message has been received. We&apos;ll respond
                within one business day.
              </p>
            )}
            {!state.ok && state.error && (
              <p
                role="alert"
                className="mt-4 inline-flex items-start gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {state.error}
              </p>
            )}
          </form>
        </div>

        <div className="container-tight mt-14 md:mt-20">
          <ContactMap />
        </div>
      </section>
    </>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  error,
  maxLength,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  error?: string;
  maxLength?: number;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        maxLength={maxLength}
        autoComplete={autoComplete}
        className={inputClass(!!error) + " mt-1.5"}
      />
      {error && (
        <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </p>
      )}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return (
    "w-full rounded-lg border bg-white/60 backdrop-blur px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 dark:bg-white/5 " +
    (hasError
      ? "border-destructive/60 focus:border-destructive focus:ring-destructive/20"
      : "border-glass-border focus:border-primary focus:ring-primary/20")
  );
}

type OfficeKey = "head" | "corporate";

const OFFICES: Record<
  OfficeKey,
  {
    label: string;
    address: string;
    coords: string;
    embedSrc: string;
    directions: string;
  }
> = {
  head: {
    label: "Head Office",
    address: COMPANY_CONTACT.office,
    coords: "23.8249° N, 90.3654° E",
    embedSrc:
      "https://www.google.com/maps/embed?pb=!1m12!1m8!1m3!1d1335.1806239809775!2d90.36537864883196!3d23.824855996977362!3m2!1i1024!2i768!4f13.1!2m1!1syess%20bangla%20private%20limited!5e1!3m2!1sen!2sbd!4v1778393025429!5m2!1sen!2sbd",
    directions: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      "Yess Bangla Private Limited, Green View, House 127, Road 3, Block A, Mirpur 12, Dhaka 1216"
    )}`,
  },
  corporate: {
    label: "Corporate Office",
    address: COMPANY_CONTACT.corporateOffice,
    coords: "23.8268° N, 90.3640° E",
    embedSrc: `https://www.google.com/maps?q=${encodeURIComponent(
      "Section 11, Block A, Road 3, Plot 10, Pallabi, Mirpur, Dhaka 1216"
    )}&z=17&output=embed`,
    directions: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      "Section 11, Block A, Road 3, Plot 10, Pallabi, Mirpur, Dhaka 1216"
    )}`,
  },
};

function ContactMap() {
  const [active, setActive] = useState<OfficeKey>("head");
  const office = OFFICES[active];
  const cmsMap = toMapEmbedSrc(useSettingText("contact_map", ""));
  const embedSrc = active === "head" && cmsMap ? cmsMap : office.embedSrc;

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            Visit us
          </div>
          <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
            Find our offices on the map
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Toggle between our Head Office and Corporate Office in Mirpur,
            Dhaka — both verified on Google Maps.
          </p>
        </div>
        <div
          role="tablist"
          aria-label="Select office to view on map"
          className="inline-flex self-start rounded-full border border-glass-border bg-white/60 p-1 shadow-sm backdrop-blur dark:bg-white/5"
        >
          {(Object.keys(OFFICES) as OfficeKey[]).map((key) => {
            const selected = key === active;
            return (
              <button
                key={key}
                role="tab"
                aria-selected={selected}
                onClick={() => setActive(key)}
                className={
                  "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors " +
                  (selected
                    ? "bg-gradient-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-primary")
                }
              >
                {OFFICES[key].label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-glass-border shadow-elegant">
        <iframe
          key={embedSrc}
          title={`YESS Bangla — ${office.label}, Mirpur, Dhaka`}
          src={embedSrc}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-[360px] w-full md:h-[460px]"
          style={{ border: 0 }}
          allowFullScreen
        />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {office.label}: {office.address} ({office.coords})
      </p>
    </>
  );
}
