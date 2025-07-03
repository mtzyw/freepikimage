export interface GenerationTask {
  uuid: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  prompt: string;
  style: string;
  format: string;
  image_url?: string;
  svg_url?: string; // SVG格式URL
  png_url?: string; // PNG格式URL
  error_message?: string;
  estimated_remaining?: number;
}

export interface GenerationBatch {
  id: string;
  prompt: string;
  style: string;
  format: string;
  tasks: GenerationTask[];
  isGenerating: boolean;
  createdAt?: Date;
}

export const ICON_STYLES = [
  { id: "solid", label: "Solid", icon: "⭐" },
  { id: "outline", label: "Outline", icon: "☆" },
  { id: "color", label: "Color", icon: "🎨" },
  { id: "flat", label: "Flat", icon: "📱" },
  { id: "sticker", label: "Sticker", icon: "🏷️" }
] as const;