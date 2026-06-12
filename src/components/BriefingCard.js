"use client";

import { Tag } from "antd";
import { getCardConfig } from "@/lib/card-types";
import { getCardColorVars } from "@/lib/branding";
import { createEditTarget, isSameEditTarget } from "@/lib/slide-edit";
import BrandMark from "./BrandMark";
import EditableElement from "./EditableElement";
import styles from "./BriefingCard.module.css";

function MetadataTag({ label, value, editable, selected, onSelect }) {
  if (!value) return null;

  const content = (
    <>
      <span className={styles.metaLabel}>{label}</span>
      {value}
    </>
  );

  if (!editable) {
    return (
      <Tag className={styles.metaTag} variant="filled">
        {content}
      </Tag>
    );
  }

  return (
    <EditableElement
      editable
      selected={selected}
      onSelect={onSelect}
      label={label}
      className={styles.metaTagButton}
      as="span"
    >
      <Tag className={styles.metaTag} variant="filled">
        {content}
      </Tag>
    </EditableElement>
  );
}

export default function BriefingCard({
  card,
  branding,
  peek = false,
  presentation = false,
  revealedBullets,
  editable = false,
  slideIndex = 0,
  editTarget = null,
  onEditSelect,
}) {
  const config = getCardConfig(card.type);
  const Icon = config.icon;
  const bullets =
    card.bullets ??
    (card.description ? [card.description] : []);

  const isStepReveal = presentation && revealedBullets != null;
  const visibleBullets = isStepReveal
    ? bullets.slice(0, revealedBullets)
    : bullets;
  const showFooter =
    !peek && (card.priority || card.impact || card.status);

  const select = (element, value, bulletIndex = null) => {
    onEditSelect?.(
      createEditTarget({ slideIndex, element, value, bulletIndex })
    );
  };

  const isSelected = (element, bulletIndex = null) =>
    isSameEditTarget(editTarget, {
      slideIndex,
      element,
      bulletIndex,
    });

  return (
    <article
      className={`${styles.card} ${peek ? styles.peek : ""} ${presentation ? styles.presentation : ""} ${isStepReveal ? styles.stepReveal : ""} ${editable ? styles.editableCard : ""}`}
      style={getCardColorVars(config, branding)}
    >
      <div className={styles.cardInner}>
        {branding?.logoUrl && !peek && (
          <div className={styles.cardLogo}>
            <BrandMark branding={branding} logoOnly size="sm" />
          </div>
        )}

        <header className={styles.header}>
          <EditableElement
            editable={editable}
            selected={isSelected("card")}
            onSelect={() => select("card", card.title)}
            label="This card"
            className={styles.headerMain}
            as="div"
          >
            <div className={styles.iconWrap}>
              <Icon className={styles.icon} />
            </div>
            <span className={styles.typeLabel}>{config.label}</span>
          </EditableElement>
        </header>

        <div className={styles.cardBody}>
          <EditableElement
            editable={editable}
            selected={isSelected("cardTitle")}
            onSelect={() => select("cardTitle", card.title)}
            label="Card title"
            className={`${styles.title} ${styles.titleEditable}`}
            as="h2"
          >
            {card.title}
          </EditableElement>

          {!peek && visibleBullets.length > 0 && (
            <ul className={styles.bullets}>
              {visibleBullets.map((bullet, i) => (
                <li key={i} className={isStepReveal ? styles.bulletReveal : undefined}>
                  <EditableElement
                    editable={editable}
                    selected={isSelected("bullet", i)}
                    onSelect={() => select("bullet", bullet, i)}
                    label={`Bullet ${i + 1}`}
                    className={styles.bulletText}
                    as="span"
                  >
                    {bullet}
                  </EditableElement>
                </li>
              ))}
            </ul>
          )}

          {!peek && (
            <div className={styles.watermark} aria-hidden="true">
              <Icon className={styles.watermarkIcon} />
            </div>
          )}
        </div>

        {showFooter && (
          <footer className={styles.cardFooter}>
            <MetadataTag
              label="Priority"
              value={card.priority}
              editable={editable}
              selected={isSelected("priority")}
              onSelect={() => select("priority", card.priority)}
            />
            <MetadataTag
              label="Impact"
              value={card.impact}
              editable={editable}
              selected={isSelected("impact")}
              onSelect={() => select("impact", card.impact)}
            />
            <MetadataTag
              label="Status"
              value={card.status}
              editable={editable}
              selected={isSelected("status")}
              onSelect={() => select("status", card.status)}
            />
          </footer>
        )}
      </div>
    </article>
  );
}
