import {
  DashboardOutlined,
  RiseOutlined,
  BulbOutlined,
  QuestionCircleOutlined,
  WarningOutlined,
  FlagOutlined,
  ArrowRightOutlined,
  StarOutlined,
} from "@ant-design/icons";

export const CARD_TYPE_CONFIG = {
  status: {
    label: "Status",
    icon: DashboardOutlined,
    accent: "#10b981",
    bg: "#ecfdf5",
    border: "#a7f3d0",
  },
  progress: {
    label: "Progress",
    icon: RiseOutlined,
    accent: "#3b82f6",
    bg: "#eff6ff",
    border: "#bfdbfe",
  },
  key_insight: {
    label: "Key Insight",
    icon: BulbOutlined,
    accent: "#f59e0b",
    bg: "#fffbeb",
    border: "#fde68a",
  },
  decision_required: {
    label: "Decision Required",
    icon: QuestionCircleOutlined,
    accent: "#8b5cf6",
    bg: "#f5f3ff",
    border: "#ddd6fe",
  },
  risk: {
    label: "Risk",
    icon: WarningOutlined,
    accent: "#ef4444",
    bg: "#fef2f2",
    border: "#fecaca",
  },
  action_item: {
    label: "Action Item",
    icon: FlagOutlined,
    accent: "#06b6d4",
    bg: "#ecfeff",
    border: "#a5f3fc",
  },
  next_steps: {
    label: "Next Steps",
    icon: ArrowRightOutlined,
    accent: "#6366f1",
    bg: "#eef2ff",
    border: "#c7d2fe",
  },
  recommendation: {
    label: "Recommendation",
    icon: StarOutlined,
    accent: "#ec4899",
    bg: "#fdf2f8",
    border: "#fbcfe8",
  },
};

export function getCardConfig(type) {
  return CARD_TYPE_CONFIG[type] ?? CARD_TYPE_CONFIG.status;
}
