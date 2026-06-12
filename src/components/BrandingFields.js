"use client";

import { Input, Upload, Button } from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import BrandMark from "./BrandMark";
import { normalizeBranding } from "@/lib/branding";
import styles from "./BrandingFields.module.css";

const MAX_LOGO_BYTES = 512 * 1024;

export default function BrandingFields({ value, onChange, disabled = false }) {
  const branding = normalizeBranding(value);

  const update = (patch) => {
    onChange(normalizeBranding({ ...branding, ...patch }));
  };

  const handleFile = (file) => {
    if (file.size > MAX_LOGO_BYTES) {
      return false;
    }
    const reader = new FileReader();
    reader.onload = () => update({ logoUrl: reader.result });
    reader.readAsDataURL(file);
    return false;
  };

  return (
    <div className={styles.fields}>
      <Input
        placeholder="Organization name"
        value={branding.orgName ?? ""}
        onChange={(e) => update({ orgName: e.target.value })}
        disabled={disabled}
      />
      <Input
        placeholder="Logo URL (optional)"
        value={branding.logoUrl?.startsWith("data:") ? "" : (branding.logoUrl ?? "")}
        onChange={(e) => update({ logoUrl: e.target.value })}
        disabled={disabled}
      />
      <div className={styles.uploadRow}>
        <Upload
          accept="image/*"
          showUploadList={false}
          beforeUpload={handleFile}
          disabled={disabled}
        >
          <Button icon={<UploadOutlined />} disabled={disabled}>
            Upload logo
          </Button>
        </Upload>
        {branding.logoUrl && (
          <Button
            type="text"
            icon={<DeleteOutlined />}
            onClick={() => update({ logoUrl: null })}
            disabled={disabled}
          >
            Remove logo
          </Button>
        )}
      </div>
      {(branding.orgName || branding.logoUrl) && (
        <div className={styles.preview}>
          <span className={styles.previewLabel}>Preview</span>
          <BrandMark branding={branding} size="md" logoOnly />
          {branding.logoHeight && (
            <span className={styles.sizeHint}>
              AI size: {branding.logoHeight}px × {branding.logoMaxWidth}px max
            </span>
          )}
          {!branding.logoHeight && branding.logoUrl && (
            <span className={styles.sizeHint}>
              Size is optimized by AI (smallest readable) when you save or generate
            </span>
          )}
        </div>
      )}
    </div>
  );
}
