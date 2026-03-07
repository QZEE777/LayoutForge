"""
KDP validation rules. Each rule is a function:
  (doc: dict) -> list[dict] where each dict has page, rule_id, severity, message, bbox (optional).
Severity: "ERROR" | "WARNING". Document fails if any rule returns ERROR.
"""
from app.rules.page_rules import (
    rule_min_page_count,
    rule_max_page_count,
    rule_consistent_trim_size,
    rule_allowed_trim_sizes,
    rule_bleed_validation,
    rule_orientation_consistency,
    rule_empty_page_detection,
    rule_rotated_pages,
    rule_mixed_page_sizes,
    rule_trim_box_validation,
    rule_pdf_version,
    rule_transparency_flattening,
)
from app.rules.margin_rules import (
    rule_gutter_margin,
    rule_outside_margin_min,
    rule_top_margin_min,
    rule_bottom_margin_min,
    rule_text_outside_trim,
    rule_safe_zone_validation,
)
from app.rules.font_rules import (
    rule_embedded_fonts,
    rule_minimum_font_size,
    rule_restricted_font_embedding,
)
from app.rules.image_rules import (
    rule_image_bleed,
    rule_image_resolution,
    rule_image_color_mode,
    rule_image_placement,
)
from app.rules.trim_rules import rule_kdp_trim_profile

# Ordered list of rules (id, name, fn)
ALL_RULES = [
    ("MIN_PAGE_COUNT", "Minimum page count (24)", rule_min_page_count),
    ("MAX_PAGE_COUNT", "Maximum page count (828)", rule_max_page_count),
    ("CONSISTENT_TRIM", "Consistent trim size", rule_consistent_trim_size),
    ("ALLOWED_TRIM_SIZES", "Allowed trim sizes", rule_allowed_trim_sizes),
    ("BLEED_VALIDATION", "Bleed validation", rule_bleed_validation),
    ("GUTTER_MARGIN", "Inside gutter margin", rule_gutter_margin),
    ("OUTSIDE_MARGIN_MIN", "Outside margin minimum (0.25\")", rule_outside_margin_min),
    ("TOP_MARGIN_MIN", "Top margin minimum (0.25\")", rule_top_margin_min),
    ("BOTTOM_MARGIN_MIN", "Bottom margin minimum (0.25\")", rule_bottom_margin_min),
    ("TEXT_OUTSIDE_TRIM", "Text outside trim", rule_text_outside_trim),
    ("IMAGE_BLEED", "Image bleed validation", rule_image_bleed),
    ("IMAGE_RESOLUTION", "Image resolution (300 DPI)", rule_image_resolution),
    ("IMAGE_COLOR_MODE", "Image color mode (RGB/Grayscale)", rule_image_color_mode),
    ("EMBEDDED_FONTS", "Embedded fonts", rule_embedded_fonts),
    ("MIN_FONT_SIZE", "Minimum font size (7pt)", rule_minimum_font_size),
    ("PDF_VERSION", "PDF version 1.4+", rule_pdf_version),
    ("TRANSPARENCY_FLATTENING", "Transparency flattening", rule_transparency_flattening),
    ("ORIENTATION_CONSISTENCY", "Orientation consistency", rule_orientation_consistency),
    ("EMPTY_PAGE", "Empty page detection", rule_empty_page_detection),
    ("IMAGE_PLACEMENT", "Image placement (margins)", rule_image_placement),
    ("ROTATED_PAGES", "Rotated pages (reject)", rule_rotated_pages),
    ("RESTRICTED_FONT_EMBEDDING", "Restricted font embedding", rule_restricted_font_embedding),
    ("MIXED_PAGE_SIZES", "Mixed page sizes", rule_mixed_page_sizes),
    ("TRIM_BOX", "Trim box validation", rule_trim_box_validation),
    ("SAFE_ZONE", "Safe zone validation", rule_safe_zone_validation),
]
ALL_RULES.append(("KDP_TRIM_PROFILE", "KDP Trim Profile", rule_kdp_trim_profile))
