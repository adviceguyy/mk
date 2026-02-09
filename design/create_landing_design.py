"""
Heritage Geometry - Mien Kingdom Landing Page Design
A museum-quality visual expression of ancestral craft meets digital community
"""

from PIL import Image, ImageDraw, ImageFont
import math

# Canvas dimensions (mobile app proportions, high resolution)
WIDTH = 1200
HEIGHT = 2400

# Color palette - Heritage Geometry
DEEP_RED = (220, 38, 38)      # #DC2626 - Primary
VERMILLION = (239, 68, 68)    # Lighter red accent
CREAM = (254, 252, 248)       # Background
WARM_WHITE = (255, 255, 255)  # Pure white
CHARCOAL = (31, 41, 55)       # Text
SILVER = (156, 163, 175)      # Secondary text
SOFT_GRAY = (243, 244, 246)   # Subtle backgrounds
GOLD_ACCENT = (180, 130, 70)  # Warm metallic accent

# Font paths
FONT_DIR = "/Users/jsaeliew/.claude/skills/canvas-design/canvas-fonts"

def create_mien_pattern_element(draw, cx, cy, size, color, rotation=0):
    """Create a single Mien-inspired geometric motif - cross-stitch diamond pattern"""
    points = []
    # Create diamond shape
    for i in range(4):
        angle = math.radians(rotation + i * 90 + 45)
        x = cx + size * math.cos(angle)
        y = cy + size * math.sin(angle)
        points.append((x, y))

    draw.polygon(points, outline=color, width=2)

    # Inner diamond
    inner_points = []
    for i in range(4):
        angle = math.radians(rotation + i * 90 + 45)
        x = cx + (size * 0.5) * math.cos(angle)
        y = cy + (size * 0.5) * math.sin(angle)
        inner_points.append((x, y))
    draw.polygon(inner_points, outline=color, width=1)

def create_cross_pattern(draw, cx, cy, size, color):
    """Create traditional Mien cross motif"""
    arm_length = size
    arm_width = size * 0.15

    # Horizontal arm
    draw.rectangle([
        cx - arm_length, cy - arm_width,
        cx + arm_length, cy + arm_width
    ], fill=color)

    # Vertical arm
    draw.rectangle([
        cx - arm_width, cy - arm_length,
        cx + arm_width, cy + arm_length
    ], fill=color)

def create_geometric_border(draw, y_start, y_end, color, pattern_size=30):
    """Create a horizontal geometric border pattern"""
    spacing = pattern_size * 2
    for x in range(0, WIDTH + spacing, spacing):
        # Diamond chain
        create_mien_pattern_element(draw, x, (y_start + y_end) // 2, pattern_size // 2, color)

def draw_stepped_diamond(draw, cx, cy, size, color, steps=4):
    """Draw a stepped/pixelated diamond - reminiscent of cross-stitch"""
    step_size = size // steps

    for i in range(steps):
        offset = i * step_size
        half_width = (steps - i) * step_size

        # Top section
        draw.rectangle([
            cx - half_width, cy - size + offset,
            cx + half_width, cy - size + offset + step_size
        ], fill=color)

        # Bottom section
        draw.rectangle([
            cx - half_width, cy + size - offset - step_size,
            cx + half_width, cy + size - offset
        ], fill=color)

def create_pattern_band(draw, y_center, band_height, primary_color, secondary_color):
    """Create a horizontal band of repeating Mien textile patterns"""
    pattern_unit = 60

    for x in range(-pattern_unit, WIDTH + pattern_unit * 2, pattern_unit * 2):
        # Main diamond
        draw_stepped_diamond(draw, x, y_center, band_height // 3, primary_color, steps=5)
        # Connecting smaller diamonds
        draw_stepped_diamond(draw, x + pattern_unit, y_center, band_height // 5, secondary_color, steps=3)

def create_corner_ornament(draw, x, y, size, color, flip_x=False, flip_y=False):
    """Create corner ornamental pattern"""
    fx = -1 if flip_x else 1
    fy = -1 if flip_y else 1

    # Stepped corner pattern
    steps = 5
    for i in range(steps):
        length = size - (i * size // steps)
        thickness = 3

        # Horizontal line
        x1 = x
        x2 = x + length * fx
        y1 = y + (i * size // steps) * fy
        y2_h = y1 + thickness * fy
        draw.rectangle([min(x1, x2), min(y1, y2_h), max(x1, x2), max(y1, y2_h)], fill=color)

        # Vertical line
        y2 = y + length * fy
        x1_v = x + (i * size // steps) * fx
        x2_v = x1_v + thickness * fx
        draw.rectangle([min(x1_v, x2_v), min(y, y2), max(x1_v, x2_v), max(y, y2)], fill=color)

def main():
    # Create canvas
    img = Image.new('RGB', (WIDTH, HEIGHT), CREAM)
    draw = ImageDraw.Draw(img)

    # Load fonts
    try:
        font_title = ImageFont.truetype(f"{FONT_DIR}/InstrumentSerif-Regular.ttf", 72)
        font_tagline = ImageFont.truetype(f"{FONT_DIR}/WorkSans-Regular.ttf", 28)
        font_button = ImageFont.truetype(f"{FONT_DIR}/WorkSans-Bold.ttf", 24)
        font_small = ImageFont.truetype(f"{FONT_DIR}/WorkSans-Regular.ttf", 18)
        font_tiny = ImageFont.truetype(f"{FONT_DIR}/WorkSans-Regular.ttf", 14)
    except:
        font_title = ImageFont.load_default()
        font_tagline = font_title
        font_button = font_title
        font_small = font_title
        font_tiny = font_title

    # === TOP DECORATIVE BAND ===
    # Subtle geometric border at very top
    for x in range(0, WIDTH, 40):
        draw.rectangle([x, 0, x + 20, 8], fill=DEEP_RED)

    # === HERO PATTERN SECTION ===
    # Large central geometric pattern area (top third of screen)
    pattern_area_top = 120
    pattern_area_bottom = 800

    # Background wash for pattern area - subtle gradient effect
    for y in range(pattern_area_top, pattern_area_bottom):
        alpha = 1 - (y - pattern_area_top) / (pattern_area_bottom - pattern_area_top)
        color = tuple(int(CREAM[i] + (SOFT_GRAY[i] - CREAM[i]) * alpha * 0.3) for i in range(3))
        draw.line([(0, y), (WIDTH, y)], fill=color)

    # Central large geometric medallion
    center_x = WIDTH // 2
    center_y = 450

    # Outer ring of diamonds
    ring_radius = 280
    num_diamonds = 12
    for i in range(num_diamonds):
        angle = math.radians(i * (360 / num_diamonds))
        dx = center_x + ring_radius * math.cos(angle)
        dy = center_y + ring_radius * math.sin(angle)
        draw_stepped_diamond(draw, int(dx), int(dy), 35, DEEP_RED, steps=4)

    # Middle ring
    ring_radius = 180
    num_diamonds = 8
    for i in range(num_diamonds):
        angle = math.radians(i * (360 / num_diamonds) + 22.5)
        dx = center_x + ring_radius * math.cos(angle)
        dy = center_y + ring_radius * math.sin(angle)
        draw_stepped_diamond(draw, int(dx), int(dy), 28, VERMILLION, steps=4)

    # Inner ring
    ring_radius = 90
    num_diamonds = 6
    for i in range(num_diamonds):
        angle = math.radians(i * (360 / num_diamonds))
        dx = center_x + ring_radius * math.cos(angle)
        dy = center_y + ring_radius * math.sin(angle)
        draw_stepped_diamond(draw, int(dx), int(dy), 22, DEEP_RED, steps=3)

    # Central medallion - solid circle with pattern
    draw.ellipse([center_x - 50, center_y - 50, center_x + 50, center_y + 50], fill=DEEP_RED)
    draw.ellipse([center_x - 35, center_y - 35, center_x + 35, center_y + 35], fill=CREAM)
    draw.ellipse([center_x - 20, center_y - 20, center_x + 20, center_y + 20], fill=DEEP_RED)

    # Corner ornaments
    create_corner_ornament(draw, 40, 140, 120, DEEP_RED)
    create_corner_ornament(draw, WIDTH - 40, 140, 120, DEEP_RED, flip_x=True)
    create_corner_ornament(draw, 40, pattern_area_bottom - 20, 120, DEEP_RED, flip_y=True)
    create_corner_ornament(draw, WIDTH - 40, pattern_area_bottom - 20, 120, DEEP_RED, flip_x=True, flip_y=True)

    # Horizontal pattern bands
    create_pattern_band(draw, 180, 50, DEEP_RED, VERMILLION)
    create_pattern_band(draw, 720, 50, DEEP_RED, VERMILLION)

    # === LOGO/BRAND SECTION ===
    logo_y = 920

    # "Mien Kingdom" title
    title_text = "Mien Kingdom"
    bbox = draw.textbbox((0, 0), title_text, font=font_title)
    title_width = bbox[2] - bbox[0]
    draw.text((center_x - title_width // 2, logo_y), title_text, fill=CHARCOAL, font=font_title)

    # Decorative line under title
    line_y = logo_y + 90
    line_width = 200
    draw.rectangle([center_x - line_width, line_y, center_x + line_width, line_y + 2], fill=DEEP_RED)

    # Small diamond accents on line
    draw_stepped_diamond(draw, center_x - line_width - 20, line_y + 1, 12, DEEP_RED, steps=2)
    draw_stepped_diamond(draw, center_x + line_width + 20, line_y + 1, 12, DEEP_RED, steps=2)

    # Tagline
    tagline = "Connect with your community"
    bbox = draw.textbbox((0, 0), tagline, font=font_tagline)
    tagline_width = bbox[2] - bbox[0]
    draw.text((center_x - tagline_width // 2, line_y + 40), tagline, fill=SILVER, font=font_tagline)

    # === LOGIN SECTION ===
    login_section_y = 1200

    # Subtle decorative elements above buttons
    for i in range(5):
        x = center_x - 100 + i * 50
        draw_stepped_diamond(draw, x, login_section_y - 60, 8, SILVER, steps=2)

    # Google Sign-in Button
    button_width = 600
    button_height = 80
    button_x = center_x - button_width // 2
    button_y = login_section_y

    # Button background with subtle border
    draw.rounded_rectangle(
        [button_x, button_y, button_x + button_width, button_y + button_height],
        radius=40,
        fill=WARM_WHITE,
        outline=SOFT_GRAY,
        width=2
    )

    # Google "G" icon placeholder (colored circles representing Google colors)
    icon_x = button_x + 50
    icon_y = button_y + button_height // 2
    icon_size = 14

    # Google colors arranged as small squares
    google_colors = [(66, 133, 244), (234, 67, 53), (251, 188, 5), (52, 168, 83)]
    for i, color in enumerate(google_colors):
        offset_x = (i % 2) * (icon_size + 2)
        offset_y = (i // 2) * (icon_size + 2)
        draw.rectangle([
            icon_x + offset_x - icon_size, icon_y + offset_y - icon_size,
            icon_x + offset_x, icon_y + offset_y
        ], fill=color)

    # Button text
    button_text = "Continue with Google"
    bbox = draw.textbbox((0, 0), button_text, font=font_button)
    text_width = bbox[2] - bbox[0]
    draw.text(
        (center_x - text_width // 2 + 20, button_y + (button_height - 24) // 2),
        button_text,
        fill=CHARCOAL,
        font=font_button
    )

    # === SECONDARY PATTERN AREA ===
    secondary_pattern_y = 1400

    # Horizontal divider line
    draw.rectangle([100, secondary_pattern_y, WIDTH - 100, secondary_pattern_y + 1], fill=SOFT_GRAY)

    # "Or" text
    or_text = "or"
    bbox = draw.textbbox((0, 0), or_text, font=font_small)
    or_width = bbox[2] - bbox[0]
    # Background for "or"
    draw.rectangle([center_x - 30, secondary_pattern_y - 12, center_x + 30, secondary_pattern_y + 14], fill=CREAM)
    draw.text((center_x - or_width // 2, secondary_pattern_y - 10), or_text, fill=SILVER, font=font_small)

    # Email sign-in option (subtle)
    email_y = secondary_pattern_y + 60
    email_text = "Sign in with email"
    bbox = draw.textbbox((0, 0), email_text, font=font_small)
    email_width = bbox[2] - bbox[0]
    draw.text((center_x - email_width // 2, email_y), email_text, fill=DEEP_RED, font=font_small)

    # === FEATURE HIGHLIGHTS ===
    features_y = 1580

    # Three feature icons/labels
    features = [
        ("Community", "Connect with Mien\npeople worldwide"),
        ("Culture", "Celebrate heritage\nand traditions"),
        ("Language", "Learn and preserve\nMien language")
    ]

    feature_spacing = WIDTH // 4
    for i, (title, desc) in enumerate(features):
        fx = feature_spacing + i * feature_spacing

        # Feature icon - geometric shape
        draw.ellipse([fx - 35, features_y, fx + 35, features_y + 70], outline=DEEP_RED, width=2)
        draw_stepped_diamond(draw, fx, features_y + 35, 18, DEEP_RED, steps=3)

        # Feature title
        bbox = draw.textbbox((0, 0), title, font=font_button)
        tw = bbox[2] - bbox[0]
        draw.text((fx - tw // 2, features_y + 85), title, fill=CHARCOAL, font=font_button)

        # Feature description
        for j, line in enumerate(desc.split('\n')):
            bbox = draw.textbbox((0, 0), line, font=font_tiny)
            lw = bbox[2] - bbox[0]
            draw.text((fx - lw // 2, features_y + 115 + j * 20), line, fill=SILVER, font=font_tiny)

    # === BOTTOM DECORATIVE SECTION ===
    bottom_pattern_y = 1850

    # Pattern band
    create_pattern_band(draw, bottom_pattern_y, 40, DEEP_RED, VERMILLION)

    # === FOOTER ===
    footer_y = 2000

    # Terms and Privacy
    terms_text = "By continuing, you agree to our"
    bbox = draw.textbbox((0, 0), terms_text, font=font_tiny)
    tw = bbox[2] - bbox[0]
    draw.text((center_x - tw // 2, footer_y), terms_text, fill=SILVER, font=font_tiny)

    links_text = "Terms of Service  •  Privacy Policy"
    bbox = draw.textbbox((0, 0), links_text, font=font_tiny)
    lw = bbox[2] - bbox[0]
    draw.text((center_x - lw // 2, footer_y + 25), links_text, fill=DEEP_RED, font=font_tiny)

    # Bottom geometric border
    for x in range(0, WIDTH, 40):
        draw.rectangle([x, HEIGHT - 8, x + 20, HEIGHT], fill=DEEP_RED)

    # === SAVE ===
    output_path = "/Users/jsaeliew/Library/CloudStorage/GoogleDrive-jai@mcya.org/Other computers/Work Laptop/files/Business/Apps/mienkingdom/design/mien-kingdom-landing-page.png"
    img.save(output_path, 'PNG', quality=95)
    print(f"Design saved to: {output_path}")

    return output_path

if __name__ == "__main__":
    main()
