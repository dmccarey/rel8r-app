import { CARD_TYPES } from "./schema";

function cloneBriefing(briefing) {
  return JSON.parse(JSON.stringify(briefing));
}

export function canRemoveElement(briefing, target) {
  switch (target.element) {
    case "orgName":
      return !!briefing.branding?.orgName;
    case "bullet": {
      const card = briefing.cards?.[target.cardIndex];
      return (card?.bullets?.length ?? 0) > 1;
    }
    case "priority":
    case "impact":
    case "status":
      return true;
    case "card":
      return (briefing.cards?.length ?? 0) > 1;
    default:
      return false;
  }
}

export function canEditText(target) {
  return target.element !== "card";
}

export function applySlideUpdate(briefing, target, newValue) {
  const next = cloneBriefing(briefing);
  const trimmed = newValue.trim();

  switch (target.element) {
    case "briefingTitle":
      next.title = trimmed;
      break;
    case "orgName":
      next.branding = { ...(next.branding ?? {}), orgName: trimmed || null };
      break;
    case "cardTitle": {
      const card = next.cards[target.cardIndex];
      if (card) card.title = trimmed;
      break;
    }
    case "bullet": {
      const card = next.cards[target.cardIndex];
      if (card?.bullets && target.bulletIndex != null) {
        card.bullets[target.bulletIndex] = trimmed;
      }
      break;
    }
    case "priority":
    case "impact": {
      const card = next.cards[target.cardIndex];
      if (card) {
        const normalized = trimmed.toLowerCase();
        card[target.element] = ["low", "medium", "high"].includes(normalized)
          ? normalized
          : trimmed;
      }
      break;
    }
    case "status": {
      const card = next.cards[target.cardIndex];
      if (card) card.status = trimmed || null;
      break;
    }
    default:
      break;
  }

  return next;
}

export function applySlideRemove(briefing, target) {
  const next = cloneBriefing(briefing);

  switch (target.element) {
    case "orgName":
      if (next.branding) next.branding.orgName = null;
      break;
    case "bullet": {
      const card = next.cards[target.cardIndex];
      if (card?.bullets && target.bulletIndex != null && card.bullets.length > 1) {
        card.bullets.splice(target.bulletIndex, 1);
      }
      break;
    }
    case "priority":
    case "impact":
    case "status": {
      const card = next.cards[target.cardIndex];
      if (card) card[target.element] = null;
      break;
    }
    case "card":
      if (next.cards.length > 1) {
        next.cards.splice(target.cardIndex, 1);
      }
      break;
    default:
      break;
  }

  return next;
}

export function isValidCardType(type) {
  return CARD_TYPES.includes(type);
}
