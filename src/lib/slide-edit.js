export function createEditTarget({
  slideIndex,
  element,
  value,
  bulletIndex = null,
}) {
  return {
    slideIndex,
    cardIndex: slideIndex > 0 ? slideIndex - 1 : null,
    element,
    bulletIndex,
    value: value ?? "",
    label: getTargetLabel(element, bulletIndex),
  };
}

export function getTargetLabel(element, bulletIndex = null) {
  switch (element) {
    case "briefingTitle":
      return "Briefing title";
    case "orgName":
      return "Organization name";
    case "cardType":
      return "Card type";
    case "cardTitle":
      return "Card title";
    case "bullet":
      return bulletIndex != null ? `Bullet ${bulletIndex + 1}` : "Bullet";
    case "priority":
      return "Priority";
    case "impact":
      return "Impact";
    case "status":
      return "Status";
    case "card":
      return "This card";
    default:
      return "Selection";
  }
}

export function isSameEditTarget(a, b) {
  if (!a || !b) return false;
  return (
    a.slideIndex === b.slideIndex &&
    a.element === b.element &&
    a.bulletIndex === b.bulletIndex
  );
}
