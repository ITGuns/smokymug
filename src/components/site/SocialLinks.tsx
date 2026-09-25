import { cn } from "@/lib/cn";

type IconProps = { className?: string };

/** Default glyph size; a className passed in replaces it (cn() joins classes, it does not merge conflicts). */
const ICON_SIZE = "h-[18px] w-[18px]";

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className ?? ICON_SIZE} fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className ?? ICON_SIZE} fill="currentColor">
      <path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.6 1.6-1.6h1.7V4.3c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2v2.4H7.4V14h2.8v8h3.3z" />
    </svg>
  );
}

export function MailIcon({ className }: IconProps) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className ?? ICON_SIZE} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </svg>
  );
}

/** Instagram / Facebook / Email icon links, matching the original site's header actions. Omit a prop to hide that link. */
export function SocialLinks({
  instagramUrl,
  facebookUrl,
  email,
  className,
  linkClassName,
  iconClassName,
}: {
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  email?: string | null;
  className?: string;
  linkClassName?: string;
  iconClassName?: string;
}) {
  const links = [
    instagramUrl ? { key: "instagram", href: instagramUrl, label: "Instagram", Icon: InstagramIcon, external: true } : null,
    facebookUrl ? { key: "facebook", href: facebookUrl, label: "Facebook", Icon: FacebookIcon, external: true } : null,
    email ? { key: "email", href: `mailto:${email}`, label: `Email ${email}`, Icon: MailIcon, external: false } : null,
  ].filter((l): l is NonNullable<typeof l> => l !== null);

  if (!links.length) return null;
  return (
    <ul className={cn("flex items-center", className)}>
      {links.map(({ key, href, label, Icon, external }) => (
        <li key={key}>
          <a href={href} aria-label={label} className={linkClassName} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
            <Icon className={iconClassName} />
          </a>
        </li>
      ))}
    </ul>
  );
}
