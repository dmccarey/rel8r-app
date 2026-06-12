"use client";

import { Button, Input, Modal } from "antd";
import { canEditText, canRemoveElement } from "@/lib/apply-slide-edit";
import styles from "./SlideEditModal.module.css";

const { TextArea } = Input;

export default function SlideEditModal({
  open,
  target,
  briefing,
  value,
  onValueChange,
  onClose,
  onSave,
  onRemove,
  saving,
}) {
  if (!target) return null;

  const showText = canEditText(target);
  const showRemove = briefing ? canRemoveElement(briefing, target) : false;
  const isCardRemove = target.element === "card";

  return (
    <Modal
      title={target.label}
      open={open}
      onCancel={() => !saving && onClose()}
      footer={
        <div className={styles.footer}>
          {showRemove && (
            <Button danger onClick={onRemove} disabled={saving} size="small">
              Remove
            </Button>
          )}
          <div className={styles.footerActions}>
            <Button onClick={onClose} disabled={saving} size="small">
              Cancel
            </Button>
            {showText && (
              <Button
                type="primary"
                onClick={onSave}
                loading={saving}
                disabled={!value.trim()}
                size="small"
              >
                Save
              </Button>
            )}
          </div>
        </div>
      }
      width={400}
      centered
      destroyOnHidden
      className={styles.modal}
      mask={{ closable: !saving }}
    >
      {isCardRemove ? (
        <p className={styles.hint}>Remove this card from the briefing?</p>
      ) : showText ? (
        <TextArea
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          autoSize={{ minRows: 2, maxRows: 6 }}
          disabled={saving}
          autoFocus
          className={styles.input}
        />
      ) : null}
    </Modal>
  );
}
