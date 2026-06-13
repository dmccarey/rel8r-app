'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Spin, Alert, Collapse } from 'antd';
import { ThunderboltOutlined, LayoutOutlined, PlayCircleOutlined, ShareAltOutlined } from '@ant-design/icons';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    setBranding(loadDefaultBranding());
  }, []);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const handleGenerate = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    saveDefaultBranding(branding);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, branding })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      cacheBriefing(data.id, {
        title: data.title,
        cards: data.cards,
        sourceText: data.sourceText ?? text.trim(),
        branding: data.branding ?? null
      });
      if (data.branding) {
        saveDefaultBranding(data.branding);
      }
      router.push(`/brief/${data.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
                  onChange={(e) => setText(e.target.value)}
                  placeholder={PLACEHOLDER}
                  autoSize={{ minRows: 8, maxRows: 16 }}
                  className={styles.textarea}
                  disabled={loading}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && text.trim()) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                />
              </div>
            </div>

            <div className={styles.actions}>
              <Button
                type="primary"
                size="large"
                icon={<ThunderboltOutlined />}
                onClick={handleGenerate}
                loading={loading}
                disabled={!text.trim() || loading}
                className={styles.generateBtn}
              >
                Generate
              </Button>
              <p className={styles.actionHint}>
                {text.trim() ? '⌘/Ctrl + Enter to generate' : 'Typical read time · 30–60 seconds'}
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
            Extracting signal from noise…
            {branding.logoUrl ? ' Optimizing logo & colors…' : ''}
          </p>
        </div>
      )}
    </div>
  );
}
