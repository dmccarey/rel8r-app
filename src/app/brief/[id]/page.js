"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Spin, Result, Button } from "antd";
import Link from "next/link";
import BriefingViewer from "@/components/BriefingViewer";
import { getCachedBriefing, cacheBriefing } from "@/lib/briefing-cache";
import styles from "./page.module.css";

export default function BriefPage() {
  const { id: briefId } = useParams();
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!briefId) return;

    async function fetchBriefing() {
      const cached = getCachedBriefing(briefId);
      if (cached) {
        setBriefing(cached);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/brief/${briefId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Briefing not found");
        }

        setBriefing(data);
        cacheBriefing(briefId, data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchBriefing();
  }, [briefId]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <Result
          status="404"
          title="Briefing not found"
          subTitle={error}
          extra={
            <Link href="/">
              <Button type="primary">Create a new briefing</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return <BriefingViewer briefing={briefing} briefId={briefId} />;
}
