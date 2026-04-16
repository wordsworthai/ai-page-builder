import { registerFieldType } from "./registry";
import { ImagePickerField } from "./components/ImagePickerField";
import { VideoPickerField } from "./components/VideoPickerField";
import { ColorPickerField } from "./components/ColorPickerField";
import { HrefPickerField } from "./components/HrefPickerField";
import { FontPickerField } from "./components/FontPickerField";
import { SectionHeaderField } from "./components/SectionHeaderField";
import { MapPickerField } from "./components/MapPickerField";
import { IconSvgTextPickerField } from "./components/IconSvgTextPickerField";
import { ExpandableTextField } from "./components/ExpandableTextField";

let isRegistered = false;

/**
 * Register LiquidEditor field type renderers here.
 * Keeping this in one place makes it easy to see what's overridden.
 * This function is idempotent - safe to call multiple times.
 */
export function registerLiquidFieldTypes() {
  if (isRegistered) return;
  registerFieldType("liquid.image_picker", ImagePickerField);
  registerFieldType("liquid.video_picker", VideoPickerField);
  registerFieldType("liquid.color_picker", ColorPickerField);
  registerFieldType("liquid.href_picker", HrefPickerField);
  registerFieldType("liquid.font_picker", FontPickerField);
  registerFieldType("liquid.section_header", SectionHeaderField);
  registerFieldType("liquid.map_picker", MapPickerField);
  registerFieldType("liquid.icon_svg_text_picker", IconSvgTextPickerField);
  registerFieldType("liquid.expandable_text", ExpandableTextField);
  isRegistered = true;
}

