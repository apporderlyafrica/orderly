// Brand logo components. Colors match the reference mark:
// navy strokes #0e1e38, accent green #75fb90.
import type { ReactNode } from "react";

export const LOGO_NAVY = "#0e1e38";
export const LOGO_GREEN = "#75fb90";

export function LogoMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect x="104" y="104" width="300" height="300" rx="80" stroke={LOGO_NAVY} strokeWidth="30" />
      {/* title line */}
      <line x1="172" y1="190" x2="344" y2="190" stroke={LOGO_NAVY} strokeWidth="26" strokeLinecap="round" />
      {/* bullet rows */}
      <circle cx="180" cy="270" r="17" fill={LOGO_GREEN} />
      <line x1="234" y1="270" x2="334" y2="270" stroke={LOGO_NAVY} strokeWidth="24" strokeLinecap="round" />
      <circle cx="180" cy="332" r="17" fill={LOGO_GREEN} />
      <line x1="234" y1="332" x2="300" y2="332" stroke={LOGO_NAVY} strokeWidth="24" strokeLinecap="round" />
      {/* check */}
      <path
        d="M298 352 L348 404 L420 314"
        stroke={LOGO_GREEN}
        strokeWidth="44"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function Logo({
  size = 32,
  textClassName = "text-xl font-extrabold tracking-tight",
  textClass,
  markClass,
}: {
  size?: number;
  textClassName?: string;
  textClass?: string;
  markClass?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} className={markClass} />
      <span className={textClass ?? textClassName} style={{ color: LOGO_NAVY }}>
        Orderly
      </span>
    </span>
  );
}

export function LogoLockup({
  size = 44,
  className = "",
  tagline = true,
}: {
  size?: number;
  className?: string;
  tagline?: boolean;
}) {
  return (
    <div className={`inline-flex flex-col items-start ${className}`}>
      <div className="flex items-center gap-3">
        <LogoMark size={size} />
        <span className="leading-none">
          <span className="block text-3xl font-extrabold tracking-tight" style={{ color: LOGO_NAVY }}>
            Orderly
          </span>
          {tagline && (
            <span className="mt-1 block text-[13px] font-medium text-muted-foreground">
              Maîtrisez chaque commande.
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

// Convenience for favicon/head meta (mark only, base64-free inline string).
export function LogoTitle({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
