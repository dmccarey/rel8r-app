"use client";

import { LayoutOutlined } from "@ant-design/icons";
import BrandMark from "./BrandMark";
import { hasLogoTheme } from "@/lib/branding";
import { createEditTarget, isSameEditTarget } from "@/lib/slide-edit";
import EditableElement from "./EditableElement";
import styles from "./TitleSlide.module.css";

export default function TitleSlide({
  title,
  branding,
  presentation = false,
  capture = false,
  editable = false,
  slideIndex = 0,
  editTarget = null,
  onEditSelect,
}) {
  const style = hasLogoTheme(branding)
    ? {
        "--card-accent": branding.theme.accent,
        "--card-border": branding.theme.border,
      }
    : undefined;

  const select = (element, value) => {
    onEditSelect?.(createEditTarget({ slideIndex, element, value }));
  };

  const isSelected = (element) =>
    isSameEditTarget(editTarget, { slideIndex, element, bulletIndex: null });

  return (
    <article
      className={`${styles.card} ${presentation ? styles.presentation : ""} ${capture ? styles.capture : ""} ${editable ? styles.editableCard : ""}`}
      style={style}
    >
      <div className={styles.cardInner}>
        {branding?.logoUrl && (
          <div className={styles.logo}>
            <BrandMark branding={branding} logoOnly size="md" />
          </div>
        )}
        <div className={styles.body}>
          <EditableElement
            editable={editable}
            selected={isSelected("briefingTitle")}
            onSelect={() => select("briefingTitle", title)}
            label="Briefing title"
            className={`${styles.title} ${styles.titleEditable}`}
            as="h2"
          >
            {title}
          </EditableElement>
          {branding?.orgName && (
            <EditableElement
              editable={editable}
              selected={isSelected("orgName")}
              onSelect={() => select("orgName", branding.orgName)}
              label="Organization name"
              className={styles.orgName}
              as="p"
            >
              {branding.orgName}
            </EditableElement>
          )}
        </div>

        <div className={styles.watermark} aria-hidden="true">
          <LayoutOutlined className={styles.watermarkIcon} />
        </div>
      </div>
    </article>
  );
}
