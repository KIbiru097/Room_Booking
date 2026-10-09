"use client"

import * as React from "react"
import Link from "next/link"
import { Hotel } from "lucide-react"
import { useAuth } from "@/lib/auth-store"
import { useLanguage } from "@/lib/i18n"

type FooterLink = { href: string ;label: string }

export default function Footer() {
  const { user } = useAuth()
  const { t } = useLanguage()

  const year = new Date().getFullYear()

  const exploreLinks: FooterLink[] = [
    { href: "/", label: t("common", "home") },
    { href: "/discover", label: t("common", "discover") },
    { href: "/search", label: t("common", "explore") },
    { href: "/emergency", label: t("common", "footerEmergency") },
  ]

  const accountLinks: FooterLink[] = user
    ? [
        { href: "/dashboard", label: t("common", "dashboard") },
        { href: "/trips", label: t("common", "myTrips") },
        { href: "/favorites", label: t("common", "footerFavorites") },
        {
          href: "/payment-history",
          label: t("common", "footerPaymentHistory"),
        },
      ]
    : [
        { href: "/auth?mode=login", label: t("common", "signIn") },
        { href: "/auth?mode=register", label: t("common", "register") },
      ]

  const portalLinks: FooterLink[] =
    user?.role === "ADMIN"
      ? [{ href: "/admin", label: t("common", "adminPortal") }]
      : user?.role === "MANAGER"
        ? [{ href: "/manager", label: t("common", "managerConsole") }]
        : user?.role === "STAFF"
          ? [{ href: "/staff", label: t("common", "staffDesk") }]
          : []

  const linkClass =
    "-mx-2 block rounded-lg px-2 py-1.5 text-sm text-white/65 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e4bd55]/60"
  const headingClass =
    "mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#e4bd55]"

  const renderColumn = (title: string, links: FooterLink[], note?: string) => (
    <nav aria-label={title}>
      <h2 className={headingClass}>{title}</h2>
      <ul className="space-y-1">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={linkClass}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
      {note && links.length === 0 ? (
        <p className="max-w-[15rem] text-sm leading-relaxed text-white/50">
          {note}
        </p>
      ) : null}
    </nav>
  )

  return (
    <footer className="mt-16 border-t border-white/10 bg-[#0b1528] text-white">
      <div className="h-px bg-gradient-to-r from-transparent via-[#e4bd55]/45 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link
              href="/"
              className="group inline-flex items-center gap-3 focus-visible:outline-none"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#e4bd55] to-[#B38F46] shadow-md shadow-[#e4bd55]/25 transition-transform duration-200 group-hover:scale-105">
                <Hotel className="h-5 w-5 text-[#07111f]" aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-xl font-bold tracking-tight">
                  LuxStay
                </span>
                <span className="-mt-1 text-[10px] font-bold uppercase tracking-widest text-[#e4bd55]">
                  {t("common", "luxuryStays")}
                </span>
              </div>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              {t("common", "footerTagline")}
            </p>
          </div>

          {renderColumn(t("common", "footerExplore"), exploreLinks)}
          {renderColumn(t("common", "footerAccount"), accountLinks)}
          {renderColumn(
            t("common", "footerPortals"),
            portalLinks,
            portalLinks.length === 0
              ? t("common", "footerPortalHint")
              : undefined,
          )}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-white/50">
            © {year} LuxStay. {t("common", "footerRights")}
          </p>
          <p className="text-xs text-white/40">{t("common", "luxuryStays")}</p>
        </div>
      </div>
    </footer>
  )
}
