"""
KDP validation rules registry.
Each rule: (id, name, fn) where fn(doc: dict) -> list[dict].
Severity: "ERROR" | "WARNING". Document fails if any rule returns ERROR.
"""
from app.rules.page_rules import (
    rule_min_page_count,
    rule_max_page_count,
    rule_odd_page_count,
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
    rule_interactive_elements,
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

# ─────────────────────────────────────────────────────────────────────────────
# ALL_RULES — ordered list of (rule_id, display_name, function)
# ─────────────────────────────────────────────────────────────────────────────
ALL_RULES = [
    # Page count
    ("MIN_PAGE_COUNT",           "Minimum page count (24)",              rule_min_page_count),
    ("MAX_PAGE_COUNT",           "Maximum page count (828/550)",         rule_max_page_count),
    ("ODD_PAGE_COUNT",           "Odd page count warning",               rule_odd_page_count),

    # Dimensions & trim
    ("CONSISTENT_TRIM",          "Consistent trim size",                 rule_consistent_trim_size),
    ("ALLOWED_TRIM_SIZES",       "Allowed KDP trim sizes",               rule_allowed_trim_sizes),
    ("MIXED_PAGE_SIZES",         "Mixed page sizes",                     rule_mixed_page_sizes),
    ("TRIM_BOX",                 "Trim box validation",                  rule_trim_box_validation),
    ("KDP_TRIM_PROFILE",         "KDP trim profile match",               rule_kdp_trim_profile),

    # Bleed
    ("BLEED_VALIDATION",         "Bleed validation (0.125\")",           rule_bleed_validation),

    # Margins & safe zone
    ("GUTTER_MARGIN",            "Inside gutter margin",                 rule_gutter_margin),
    ("OUTSIDE_MARGIN_MIN",       "Outside margin (0.25\" min)",          rule_outside_margin_min),
    ("TOP_MARGIN_MIN",           "Top margin (0.25\" min)",              rule_top_margin_min),
    ("BOTTOM_MARGIN_MIN",        "Bottom margin (0.25\" min)",           rule_bottom_margin_min),
    ("TEXT_OUTSIDE_TRIM",        "Text outside trim boundary",           rule_text_outside_trim),
    ("SAFE_ZONE",                "Safe zone compliance",                 rule_safe_zone_validation),

    # Images
    ("IMAGE_BLEED",              "Image bleed validation",               rule_image_bleed),
    ("IMAGE_RESOLUTION",         "Image resolution (300/1200 DPI)",      rule_image_resolution),
    ("IMAGE_COLOR_MODE",         "Image color mode & spot colors",       rule_image_color_mode),
    ("IMAGE_PLACEMENT",          "Image placement (margins)",            rule_image_placement),

    # Fonts
    ("EMBEDDED_FONTS",           "Font embedding (all fonts)",           rule_embedded_fonts),
    ("MIN_FONT_SIZE",            "Minimum font size (7pt)",              rule_minimum_font_size),
    ("RESTRICTED_FONT_EMBEDDING","Restricted font license check",        rule_restricted_font_embedding),

    # PDF structure
    ("PDF_VERSION",              "PDF version (1.3+)",                   rule_pdf_version),
    ("TRANSPARENCY_FLATTENING",  "Transparency flattening",              rule_transparency_flattening),
    ("INTERACTIVE_ELEMENTS",     "Interactive elements (forms/widgets)", rule_interactive_elements),

    # Page layout
    ("ORIENTATION_CONSISTENCY",  "Orientation consistency",              rule_orientation_consistency),
    ("ROTATED_PAGES",            "Rotated pages",                        rule_rotated_pages),
    ("EMPTY_PAGE",               "Blank page detection",                 rule_empty_page_detection),
]
