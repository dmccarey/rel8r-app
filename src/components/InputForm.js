'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Spin, Alert, Collapse } from 'antd';
import {
  ThunderboltOutlined,
  LayoutOutlined,
  PlayCircleOutlined,
  ShareAltOutlined,
  SendOutlined
} from '@ant-design/icons';
import BrandingFields from './BrandingFields';
import BriefingLibrary from './BriefingLibrary';
import { cacheBriefing } from '@/lib/briefing-cache';
import { loadDefaultBranding, saveDefaultBranding, normalizeBranding } from '@/lib/branding';
import styles from './InputForm.module.css';

const { TextArea } = Input;

const PLACEHOLDER = 'Paste meeting notes, a status update, or rough ideas…';

const FEATURES = [
  { icon: LayoutOutlined, label: '4–10 focused cards' },
  { icon: PlayCircleOutlined, label: 'Present step-by-step' },
  { icon: ShareAltOutlined, label: 'Shareable link' }
];

export default function InputForm() {
  const [text, setText] = useState('');
  const [branding, setBranding] = useState(normalizeBranding());
  const [plan, setPlan] = useState(null);
  const [followUp, setFollowUp] = useState('');
  const [planning, setPlanning] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    setBranding(loadDefaultBranding());
  }, []);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const loading = planning || generating;

  const handleTextChange = (value) => {
    setText(value);
    setPlan(null);
  };

  const requestPlan = async (sourceText) => {
    setPlanning(true);
    setError(null);

    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sourceText })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Planning failed');
      }

      setPlan(data);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setPlanning(false);
    }
  };

  const handlePlan = async () => {
    const sourceText = text.trim();
    if (!sourceText) return null;

    return requestPlan(sourceText);
  };

  const handleAddContext = async () => {
    if (!followUp.trim()) return;

    const updatedText = `${text.trim()}\n\nAdditional context from planning chat:\n${followUp.trim()}`;
    setText(updatedText);
    setFollowUp('');
    return requestPlan(updatedText);
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;

    setGenerating(true);
    setError(null);
    saveDefaultBranding(branding);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, branding, plan })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      cacheBriefing(data.id, {
        title: data.title,
        cards: data.cards,
        sourceText: data.sourceText ?? text.trim(),
        presentationPlan: data.presentationPlan ?? plan ?? null,
        branding: data.branding ?? null
      });
      if (data.branding) {
        saveDefaultBranding(data.branding);
      }
      router.push(`/brief/${data.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handlePrimaryAction = () => {
    if (plan) {
      handleGenerate();
    } else {
      handlePlan();
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <span className={styles.logo}>Slidz</span>
      </header>

      <div className={styles.main}>
        <div className={styles.layout}>
          <section className={styles.hero}>
            <h1 className={styles.headline}>Turn messy notes into updates people actually read</h1>
            <p className={styles.subtitle}>
              Paste anything unstructured. Slidz extracts the story, formats it for scanning, and gives you a link you
              can present or share.
            </p>
            <ul className={styles.features}>
              {FEATURES.map(({ icon: Icon, label }) => (
                <li key={label}>
                  <Icon className={styles.featureIcon} aria-hidden />
                  {label}
                </li>
              ))}
            </ul>
          </section>

          <div className={styles.content}>
            {error && (
              <Alert
                message={error}
                type="error"
                showIcon
                closable
                onClose={() => setError(null)}
                className={styles.alert}
              />
            )}

            <div className={styles.inputCard}>
              <div className={styles.inputCardHeader}>
                <span className={styles.inputLabel}>Your notes</span>
                <span className={styles.inputHint}>{wordCount > 0 ? `${wordCount} words` : 'Paste to begin'}</span>
              </div>
              <div className={styles.textareaWrap}>
                <TextArea
                  value={text}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder={PLACEHOLDER}
                  autoSize={{ minRows: 8, maxRows: 16 }}
                  className={styles.textarea}
                  disabled={loading}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && text.trim()) {
                      e.preventDefault();
                      handlePrimaryAction();
                    }
                  }}
                />
              </div>
            </div>

            {plan && (
              <div className={styles.planCard}>
                <div className={styles.planHeader}>
                  <span className={styles.planLabel}>Planning chat</span>
                  <span className={plan.hasEnoughInfo ? styles.readyBadge : styles.needsInfoBadge}>
                    {plan.hasEnoughInfo ? 'Ready to generate' : 'More info would help'}
                  </span>
                </div>

                <p className={styles.planMessage}>{plan.summaryMessage}</p>

                <div className={styles.planMeta}>
                  <div>
                    <span className={styles.metaLabel}>Goal</span>
                    <p>{plan.inferredGoal}</p>
                  </div>
                  <div>
                    <span className={styles.metaLabel}>Audience</span>
                    <p>{plan.targetAudience || 'Not specified'}</p>
                  </div>
                </div>

                {plan.assumptions?.length > 0 && (
                  <div className={styles.planSection}>
                    <h3>Assumptions</h3>
                    <ul>
                      {plan.assumptions.map((assumption, index) => (
                        <li key={`${assumption}-${index}`}>{assumption}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {plan.missingInfoQuestions?.length > 0 && (
                  <div className={styles.planSection}>
                    <h3>Questions to improve it</h3>
                    <ul>
                      {plan.missingInfoQuestions.map((question, index) => (
                        <li key={`${question}-${index}`}>{question}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className={styles.planSection}>
                  <h3>Slides Slidz will create</h3>
                  <ol className={styles.slidePlan}>
                    {plan.slides?.map((slide, index) => (
                      <li key={`${slide.title}-${index}`}>
                        <div>
                          <span className={styles.slideNumber}>{index + 1}</span>
                          <strong>{slide.title}</strong>
                        </div>
                        <p>{slide.purpose}</p>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className={styles.followUpBox}>
                  <TextArea
                    value={followUp}
                    onChange={(e) => setFollowUp(e.target.value)}
                    placeholder="Add answers, audience details, or direction before generating..."
                    autoSize={{ minRows: 2, maxRows: 5 }}
                    disabled={loading}
                    className={styles.followUpTextarea}
                  />
                  <Button
                    icon={<SendOutlined />}
                    onClick={handleAddContext}
                    loading={planning}
                    disabled={!followUp.trim() || loading}
                  >
                    Update plan
                  </Button>
                </div>
              </div>
            )}

            <div className={styles.actions}>
              <Button
                type="primary"
                size="large"
                icon={<ThunderboltOutlined />}
                onClick={handlePrimaryAction}
                loading={plan ? generating : planning}
                disabled={!text.trim() || loading}
                className={styles.generateBtn}
              >
                {plan ? 'Generate presentation' : 'Review slide plan'}
              </Button>
              <p className={styles.actionHint}>
                {plan
                  ? 'Confirm the outline or add context above'
                  : text.trim()
                    ? 'Command/Ctrl + Enter to review the slide plan'
                    : 'Typical read time: 30-60 seconds'}
              </p>
            </div>
          </div>

          <div className={styles.content}>
            <Collapse
              ghost
              className={styles.brandingCollapse}
              items={[
                {
                  key: 'branding',
                  label: 'Organization branding (optional)',
                  children: <BrandingFields value={branding} onChange={setBranding} disabled={loading} />
                }
              ]}
            />
          </div>

          <div className={styles.libraryBand}>
            <BriefingLibrary />
          </div>
        </div>
      </div>

      {loading && (
        <div className={styles.loadingOverlay}>
          <Spin size="large" />
          <p>
            {planning ? 'Understanding the story and planning slides...' : 'Creating the presentation...'}
            {branding.logoUrl ? ' Optimizing logo & colors…' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
