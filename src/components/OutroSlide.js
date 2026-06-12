"use client";

import styles from "./OutroSlide.module.css";

const SIGNUP_URL = "https://rel8r.ai";

export default function OutroSlide({ presentation = false }) {
  return (
    <article
      className={`${styles.card} ${presentation ? styles.presentation : ""}`}
    >
      <div className={styles.cardInner}>
        <div className={styles.body}>
          <p className={styles.eyebrow}>Made with</p>
          <h2 className={styles.brand}>Rel8r</h2>
          <p className={styles.prompt}>
            Turn messy notes into briefings people actually read.
          </p>
          <a
            href={SIGNUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.cta}
            onClick={(e) => e.stopPropagation()}
          >
            Sign up at rel8r.ai
          </a>
        </div>
      </div>
    </article>
  );
}
