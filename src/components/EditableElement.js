"use client";

import styles from "./EditableElement.module.css";

export default function EditableElement({
  editable = false,
  selected = false,
  onSelect,
  className = "",
  label,
  children,
  as: Component = "button",
}) {
  if (!editable) {
    return <Component className={className}>{children}</Component>;
  }

  const classes = [
    styles.editable,
    selected ? styles.selected : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (Component === "button") {
    return (
      <button
        type="button"
        className={classes}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.();
        }}
        aria-label={label ? `Edit ${label}` : "Edit"}
        aria-pressed={selected}
      >
        {children}
      </button>
    );
  }

  return (
    <Component
      className={classes}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onSelect?.();
        }
      }}
      aria-label={label ? `Edit ${label}` : "Edit"}
    >
      {children}
    </Component>
  );
}
