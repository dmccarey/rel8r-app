"use client";

import { LayoutOutlined } from "@ant-design/icons";
import styles from "./BriefingThumbnail.module.css";

export default function BriefingThumbnail() {
  return (
    <div className={styles.thumb}>
      <div className={styles.thumbPlaceholder} aria-hidden="true">
        <LayoutOutlined className={styles.placeholderIcon} />
      </div>
    </div>
  );
}
