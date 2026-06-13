import Link from "next/link";
import { hasBranding } from "@/lib/branding";
import styles from "./BrandMark.module.css";

export default function BrandMark({
  branding,
  size = "md",
  linkHome = false,
  subdued = false,
  inverted = false,
  logoOnly = false,
  className = "",
}) {
  if (!hasBranding(branding)) {
    if (!linkHome) return null;
    return (
      <Link href="/" className={`${styles.fallback} ${styles[size]} ${className}`}>
        Slidz
      </Link>
    );
  }

  const hasAiSize =
    branding.logoHeight != null || branding.logoMaxWidth != null;

  const logoStyle = hasAiSize
    ? {
        height: branding.logoHeight ? `${branding.logoHeight}px` : "auto",
        maxWidth: branding.logoMaxWidth
          ? `${branding.logoMaxWidth}px`
          : undefined,
        width: "auto",
      }
    : undefined;

  const content = (
    <>
      {branding.logoUrl && (
        <img
          src={branding.logoUrl}
          alt={branding.orgName ? `${branding.orgName} logo` : "Organization logo"}
          className={`${styles.logo} ${hasAiSize ? styles.logoAiSized : ""}`}
          style={logoStyle}
        />
      )}
      {branding.orgName && !logoOnly && (
        <span className={styles.name}>{branding.orgName}</span>
      )}
    </>
  );

  const classes = [
    styles.mark,
    hasAiSize ? "" : styles[size],
    subdued ? styles.subdued : "",
    inverted ? styles.inverted : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (linkHome) {
    return (
      <Link href="/" className={classes}>
        {content}
      </Link>
    );
  }

  return <div className={classes}>{content}</div>;
}
