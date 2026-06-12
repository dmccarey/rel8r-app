"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Tooltip, Drawer, Input, App } from "antd";
import {
  LeftOutlined,
  RightOutlined,
  ShareAltOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  EditOutlined,
  TrademarkOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import BriefingCard from "./BriefingCard";
import TitleSlide from "./TitleSlide";
import OutroSlide from "./OutroSlide";
import BrandingFields from "./BrandingFields";
import SlideEditModal from "./SlideEditModal";
import { cacheBriefing, upsertBriefingIndex } from "@/lib/briefing-cache";
import {
  applySlideRemove,
  applySlideUpdate,
} from "@/lib/apply-slide-edit";
import { normalizeBranding, saveDefaultBranding, getViewerThemeVars } from "@/lib/branding";
import styles from "./BriefingViewer.module.css";

const { TextArea } = Input;

const SWIPE_THRESHOLD = 60;

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

export default function BriefingViewer({
  briefing: initialBriefing,
  briefId,
  showHeader = true,
}) {
  const { message } = App.useApp();
  const [briefing, setBriefing] = useState(initialBriefing);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [presentationMode, setPresentationMode] = useState(false);
  const [refineOpen, setRefineOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const [brandDraft, setBrandDraft] = useState(normalizeBranding());
  const [savingBrand, setSavingBrand] = useState(false);
  const [edits, setEdits] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [savingSlideEdit, setSavingSlideEdit] = useState(false);
  const [slideMotionInitial, setSlideMotionInitial] = useState(false);
  const [revealedBullets, setRevealedBullets] = useState(0);
  const viewerRef = useRef(null);
  const skipRevealReset = useRef(false);

  const cards = briefing.cards ?? [];
  const slideCount = cards.length + 2;
  const isTitleSlide = currentIndex === 0;
  const isOutroSlide = currentIndex === slideCount - 1;
  const currentCard =
    currentIndex > 0 && !isOutroSlide ? cards[currentIndex - 1] : null;

  const getBulletCount = useCallback((card) => {
    if (!card) return 0;
    if (card.bullets?.length) return card.bullets.length;
    if (card.description) return 1;
    return 0;
  }, []);

  const currentBulletCount = getBulletCount(currentCard);

  useEffect(() => {
    setBriefing(initialBriefing);
  }, [initialBriefing]);

  useEffect(() => {
    setSlideMotionInitial(true);
  }, []);

  useEffect(() => {
    setEditTarget(null);
    setEditValue("");
  }, [currentIndex]);

  const handleEditSelect = useCallback((target) => {
    setEditTarget(target);
    setEditValue(target.value ?? "");
  }, []);

  const closeSlideEdit = useCallback(() => {
    setEditTarget(null);
    setEditValue("");
  }, []);

  const persistBriefing = useCallback(
    async (updated, prevIndex = currentIndex) => {
      const res = await fetch(`/api/brief/${briefId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: updated.title,
          cards: updated.cards,
          branding: updated.branding,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save");
      }

      setBriefing(data);
      cacheBriefing(briefId, data);
      upsertBriefingIndex(briefId, data);

      const newSlideCount = (data.cards?.length ?? 0) + 2;
      if (prevIndex >= newSlideCount) {
        setCurrentIndex(Math.max(0, newSlideCount - 1));
      }

      closeSlideEdit();
    },
    [briefId, currentIndex, closeSlideEdit]
  );

  useEffect(() => {
    setBrandDraft(normalizeBranding(briefing.branding));
  }, [briefing.branding]);

  const goTo = useCallback(
    (index) => {
      if (index < 0 || index >= slideCount) return;
      setDirection(index > currentIndex ? 1 : -1);
      setCurrentIndex(index);
    },
    [currentIndex, slideCount]
  );

  const goNext = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
  const goPrev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

  useEffect(() => {
    if (skipRevealReset.current) {
      skipRevealReset.current = false;
      return;
    }
    setRevealedBullets(0);
  }, [currentIndex, presentationMode]);

  const advancePresentation = useCallback(() => {
    if (revealedBullets < currentBulletCount) {
      setRevealedBullets((count) => count + 1);
      return;
    }
    if (currentIndex < slideCount - 1) {
      goNext();
    }
  }, [revealedBullets, currentBulletCount, currentIndex, slideCount, goNext]);

  const retreatPresentation = useCallback(() => {
    if (revealedBullets > 0) {
      setRevealedBullets((count) => count - 1);
      return;
    }
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      skipRevealReset.current = true;
      setDirection(-1);
      setCurrentIndex(prevIndex);
      setRevealedBullets(
        prevIndex === 0 ? 0 : getBulletCount(cards[prevIndex - 1])
      );
    }
  }, [revealedBullets, currentIndex, cards, getBulletCount]);

  const exitPresentation = useCallback(async () => {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        }
      }
    } catch {
      // Browser may reject exit when not in fullscreen.
    }
    setPresentationMode(false);
  }, []);

  const enterPresentation = useCallback(async () => {
    const el = viewerRef.current;
    if (!el) return;

    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      } else {
        setPresentationMode(true);
        return;
      }
      setPresentationMode(true);
    } catch {
      message.warning("Fullscreen is not available in this browser");
    }
  }, [message]);

  useEffect(() => {
    const syncPresentation = () => {
      const el = viewerRef.current;
      const active =
        document.fullscreenElement === el ||
        document.webkitFullscreenElement === el;
      setPresentationMode(active);
    };

    document.addEventListener("fullscreenchange", syncPresentation);
    document.addEventListener("webkitfullscreenchange", syncPresentation);
    return () => {
      document.removeEventListener("fullscreenchange", syncPresentation);
      document.removeEventListener("webkitfullscreenchange", syncPresentation);
      if (
        viewerRef.current &&
        (document.fullscreenElement === viewerRef.current ||
          document.webkitFullscreenElement === viewerRef.current)
      ) {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (refineOpen || brandOpen || editTarget) return;
      if (presentationMode) {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          advancePresentation();
          return;
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          retreatPresentation();
          return;
        }
      } else {
        if (e.key === "ArrowRight") goNext();
        if (e.key === "ArrowLeft") goPrev();
      }
      if (e.key === "Escape" && presentationMode) exitPresentation();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    goNext,
    goPrev,
    presentationMode,
    refineOpen,
    brandOpen,
    editTarget,
    exitPresentation,
    advancePresentation,
    retreatPresentation,
  ]);

  const handleShare = async () => {
    const url = `${window.location.origin}/brief/${briefId}`;
    try {
      await navigator.clipboard.writeText(url);
      message.success("Link copied to clipboard");
    } catch {
      message.info(url);
    }
  };

  const handleSaveBrand = async () => {
    setSavingBrand(true);

    try {
      const res = await fetch(`/api/brief/${briefId}/branding`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branding: brandDraft }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save branding");
      }

      setBriefing(data);
      cacheBriefing(briefId, data);
      saveDefaultBranding(data.branding);
      setBrandOpen(false);
      message.success("Branding updated");
    } catch (err) {
      message.error(err.message);
    } finally {
      setSavingBrand(false);
    }
  };

  const handleRegenerate = async () => {
    if (!edits.trim()) return;

    setRegenerating(true);

    try {
      const res = await fetch(`/api/brief/${briefId}/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ edits: edits.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Regeneration failed");
      }

      setBriefing(data);
      cacheBriefing(briefId, data);
      setCurrentIndex(0);
      setDirection(0);
      setEdits("");
      setRefineOpen(false);
      message.success("Briefing updated");
    } catch (err) {
      message.error(err.message);
    } finally {
      setRegenerating(false);
    }
  };

  const handleSlideSave = async () => {
    if (!editTarget || !editValue.trim()) return;

    setSavingSlideEdit(true);

    try {
      const updated = applySlideUpdate(briefing, editTarget, editValue);
      await persistBriefing(updated);
      message.success("Saved");
    } catch (err) {
      message.error(err.message);
    } finally {
      setSavingSlideEdit(false);
    }
  };

  const handleSlideRemove = async () => {
    if (!editTarget) return;

    setSavingSlideEdit(true);

    try {
      const prevIndex = currentIndex;
      const updated = applySlideRemove(briefing, editTarget);
      await persistBriefing(updated, prevIndex);
      message.success("Removed");
    } catch (err) {
      message.error(err.message);
    } finally {
      setSavingSlideEdit(false);
    }
  };

  const slideEditing =
    !presentationMode && !regenerating && !savingSlideEdit && !isOutroSlide;

  if (cards.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No cards in this briefing.</p>
        <Link href="/">
          <Button type="primary">Create a briefing</Button>
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={viewerRef}
      className={`${styles.viewer} ${presentationMode ? styles.presentation : ""}`}
      style={getViewerThemeVars(briefing.branding)}
    >
      {showHeader && !presentationMode && (
        <header className={styles.topBar}>
          <div className={styles.headerBrandRow}>
            <Link href="/" className={styles.logo}>
              Rel8r
            </Link>
            <span className={styles.headerDivider} aria-hidden="true" />
            <h1 className={styles.briefingTitle}>{briefing.title}</h1>
          </div>
          <div className={styles.topActions}>
            <span className={styles.cardCounter}>
              {currentIndex + 1} of {slideCount}
            </span>
            <Tooltip title="Organization branding">
              <Button
                type="text"
                icon={<TrademarkOutlined />}
                onClick={() => setBrandOpen(true)}
                aria-label="Edit branding"
              />
            </Tooltip>
            <Tooltip title="Refine briefing">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => setRefineOpen(true)}
                aria-label="Refine briefing"
              />
            </Tooltip>
            <Tooltip title="Presentation mode">
              <Button
                type="text"
                icon={<FullscreenOutlined />}
                onClick={enterPresentation}
                aria-label="Enter presentation mode"
              />
            </Tooltip>
            <Tooltip title="Copy share link">
              <Button
                type="text"
                icon={<ShareAltOutlined />}
                onClick={handleShare}
                aria-label="Share briefing"
              />
            </Tooltip>
          </div>
        </header>
      )}

      {presentationMode && (
        <div
          className={styles.presentationControls}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            type="text"
            icon={<FullscreenExitOutlined />}
            onClick={exitPresentation}
            aria-label="Exit presentation mode"
          />
        </div>
      )}

      {!showHeader || presentationMode ? (
        <div className={styles.briefingMeta}>
          <h1 className={styles.briefingTitle}>{briefing.title}</h1>
          <p className={styles.cardCounter}>
            {currentIndex + 1} of {slideCount}
          </p>
        </div>
      ) : null}

      <div className={styles.main}>
        <div
          className={`${styles.cardStage} ${presentationMode ? styles.presentationStage : ""}`}
          onClick={presentationMode ? advancePresentation : undefined}
          role={presentationMode ? "button" : undefined}
          tabIndex={presentationMode ? 0 : undefined}
          onKeyDown={
            presentationMode
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    advancePresentation();
                  }
                }
              : undefined
          }
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial={slideMotionInitial ? "enter" : false}
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              drag={regenerating || presentationMode || savingSlideEdit ? false : "x"}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={(_, info) => {
                if (info.offset.x < -SWIPE_THRESHOLD) goNext();
                else if (info.offset.x > SWIPE_THRESHOLD) goPrev();
              }}
              className={styles.cardMotion}
            >
              {isTitleSlide ? (
                <TitleSlide
                  title={briefing.title}
                  branding={briefing.branding}
                  presentation={presentationMode}
                  editable={slideEditing}
                  slideIndex={currentIndex}
                  editTarget={editTarget}
                  onEditSelect={handleEditSelect}
                />
              ) : isOutroSlide ? (
                <OutroSlide presentation={presentationMode} />
              ) : (
                <BriefingCard
                  card={currentCard}
                  branding={briefing.branding}
                  presentation={presentationMode}
                  revealedBullets={
                    presentationMode ? revealedBullets : undefined
                  }
                  editable={slideEditing}
                  slideIndex={currentIndex}
                  editTarget={editTarget}
                  onEditSelect={handleEditSelect}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className={styles.bottomBar}>
          <div className={styles.progressDots}>
            {Array.from({ length: slideCount }, (_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === currentIndex ? styles.dotActive : ""}`}
                onClick={() => goTo(i)}
                aria-label={
                  i === 0
                    ? "Go to title slide"
                    : i === slideCount - 1
                      ? "Go to outro slide"
                      : `Go to card ${i}`
                }
                aria-current={i === currentIndex ? "true" : undefined}
              />
            ))}
          </div>

          <nav className={styles.nav} aria-label="Card navigation">
            <Button
              className={styles.navBtn}
              shape="circle"
              size="large"
              icon={<LeftOutlined />}
              disabled={currentIndex === 0}
              onClick={goPrev}
              aria-label="Previous card"
            />
            <span className={styles.swipeHint}>Swipe or use arrows</span>
            <Button
              className={styles.navBtn}
              shape="circle"
              size="large"
              icon={<RightOutlined />}
              disabled={currentIndex === slideCount - 1}
              onClick={goNext}
              aria-label="Next card"
            />
          </nav>
        </div>
      </div>

      <SlideEditModal
        open={!!editTarget}
        target={editTarget}
        briefing={briefing}
        value={editValue}
        onValueChange={setEditValue}
        onClose={closeSlideEdit}
        onSave={handleSlideSave}
        onRemove={handleSlideRemove}
        saving={savingSlideEdit}
      />

      <Drawer
        title="Refine briefing"
        placement="bottom"
        size="auto"
        open={refineOpen}
        onClose={() => !regenerating && setRefineOpen(false)}
        className={styles.refineDrawer}
        footer={
          <div className={styles.refineFooter}>
            <Button onClick={() => setRefineOpen(false)} disabled={regenerating}>
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleRegenerate}
              loading={regenerating}
              disabled={!edits.trim()}
            >
              Regenerate
            </Button>
          </div>
        }
      >
        <p className={styles.refineHint}>
          Describe what to change — add detail, remove cards, adjust tone, or
          correct facts. The briefing will be regenerated with your edits applied.
        </p>
        <TextArea
          value={edits}
          onChange={(e) => setEdits(e.target.value)}
          placeholder="e.g. Add a risk about timeline slippage, merge the progress cards, make the decision card more urgent..."
          autoSize={{ minRows: 4, maxRows: 8 }}
          disabled={regenerating}
        />
      </Drawer>

      <Drawer
        title="Organization branding"
        placement="bottom"
        size="auto"
        open={brandOpen}
        onClose={() => !savingBrand && setBrandOpen(false)}
        footer={
          <div className={styles.refineFooter}>
            <Button onClick={() => setBrandOpen(false)} disabled={savingBrand}>
              Cancel
            </Button>
            <Button type="primary" onClick={handleSaveBrand} loading={savingBrand}>
              {savingBrand ? "Analyzing logo…" : "Save branding"}
            </Button>
          </div>
        }
      >
        <p className={styles.refineHint}>
          Add your organization name and logo. AI extracts colors from your
          logo for card borders, accents, and styling.
        </p>
        <BrandingFields
          value={brandDraft}
          onChange={setBrandDraft}
          disabled={savingBrand}
        />
      </Drawer>
    </div>
  );
}
