"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BriefingThumbnail from "./BriefingThumbnail";
import { listRecentBriefings } from "@/lib/briefing-cache";
import styles from "./BriefingLibrary.module.css";

function mergeBriefings(local, remote) {
  const byId = new Map();

  for (const item of remote) {
    byId.set(item.id, item);
  }

  for (const item of local) {
    const existing = byId.get(item.id);
    if (!existing) {
      byId.set(item.id, item);
      continue;
    }

    const preferred = item.createdAt >= existing.createdAt ? item : existing;
    byId.set(item.id, preferred);
  }

  return [...byId.values()].sort((a, b) => b.createdAt - a.createdAt);
}

export default function BriefingLibrary() {
  const [briefings, setBriefings] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const local = listRecentBriefings();
      let remote = [];

      try {
        const res = await fetch("/api/briefings");
        if (res.ok) {
          const data = await res.json();
          remote = data.briefings ?? [];
        }
      } catch {
        // Fall back to local index only
      }

      if (!cancelled) {
        setBriefings(mergeBriefings(local, remote));
        setLoaded(true);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded || briefings.length === 0) {
    return null;
  }

  return (
    <section className={styles.library} aria-label="Recent briefings">
      <div className={styles.header}>
        <h2 className={styles.heading}>Recent briefings</h2>
        <p className={styles.subheading}>Pick up where you left off</p>
      </div>

      <ul className={styles.grid}>
        {briefings.map((briefing) => (
          <li key={briefing.id}>
            <Link href={`/brief/${briefing.id}`} className={styles.cardLink}>
              <BriefingThumbnail />
              <div className={styles.meta}>
                <h3 className={styles.title}>{briefing.title}</h3>
                <p className={styles.detail}>
                  {briefing.cardCount}{" "}
                  {briefing.cardCount === 1 ? "card" : "cards"}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
