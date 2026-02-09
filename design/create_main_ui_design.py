"""
Heritage Geometry - Mien Kingdom Main App UI Design
Home screen with feed, navigation, and cultural design elements
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
LIGHT_GRAY = (229, 231, 235)  # Borders
GOLD_ACCENT = (180, 130, 70)  # Warm metallic accent

# Font paths
FONT_DIR = "/Users/jsaeliew/.claude/skills/canvas-design/canvas-fonts"

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

def draw_avatar(draw, x, y, size, color):
    """Draw a circular avatar placeholder"""
    draw.ellipse([x, y, x + size, y + size], fill=color)

def draw_icon_home(draw, cx, cy, size, color, filled=False):
    """Draw home icon"""
    # House shape
    points = [
        (cx, cy - size),  # Top
        (cx + size, cy),  # Right
        (cx + size * 0.6, cy),
        (cx + size * 0.6, cy + size),
        (cx - size * 0.6, cy + size),
        (cx - size * 0.6, cy),
        (cx - size, cy),  # Left
    ]
    if filled:
        draw.polygon(points, fill=color)
    else:
        draw.polygon(points, outline=color, width=2)

def draw_icon_search(draw, cx, cy, size, color):
    """Draw search/explore icon"""
    # Circle
    draw.ellipse([cx - size * 0.6, cy - size * 0.6, cx + size * 0.4, cy + size * 0.4], outline=color, width=3)
    # Handle
    draw.line([(cx + size * 0.3, cy + size * 0.3), (cx + size, cy + size)], fill=color, width=3)

def draw_icon_translate(draw, cx, cy, size, color):
    """Draw translate/language icon"""
    # Letter A
    draw.text((cx - size * 0.8, cy - size * 0.8), "A", fill=color)
    # Arrow
    draw.line([(cx, cy - size * 0.3), (cx + size * 0.5, cy)], fill=color, width=2)
    draw.line([(cx + size * 0.5, cy), (cx + size * 0.3, cy + size * 0.2)], fill=color, width=2)
    # Chinese character placeholder
    draw.rectangle([cx + size * 0.2, cy - size * 0.5, cx + size * 0.8, cy + size * 0.5], outline=color, width=2)

def draw_icon_menu(draw, cx, cy, size, color):
    """Draw menu/profile icon"""
    # Three horizontal lines
    line_height = 3
    spacing = size * 0.4
    for i in range(3):
        y = cy - spacing + i * spacing
        draw.rectangle([cx - size * 0.6, y - line_height, cx + size * 0.6, y + line_height], fill=color)

def create_post_card(draw, x, y, width, height, fonts):
    """Create a post card component"""
    card_radius = 24

    # Card background
    draw.rounded_rectangle([x, y, x + width, y + height], radius=card_radius, fill=WARM_WHITE, outline=LIGHT_GRAY, width=1)

    # User avatar
    avatar_size = 50
    avatar_x = x + 24
    avatar_y = y + 24
    draw.ellipse([avatar_x, avatar_y, avatar_x + avatar_size, avatar_y + avatar_size], fill=DEEP_RED)

    # Username
    draw.text((avatar_x + avatar_size + 16, avatar_y + 5), "Mien User", fill=CHARCOAL, font=fonts['button'])

    # Timestamp
    draw.text((avatar_x + avatar_size + 16, avatar_y + 30), "2h ago", fill=SILVER, font=fonts['tiny'])

    # Platform badge
    badge_x = x + width - 60
    draw.rounded_rectangle([badge_x, avatar_y + 10, badge_x + 36, avatar_y + 30], radius=8, fill=DEEP_RED)

    # Post content area
    content_y = avatar_y + avatar_size + 20
    draw.text((x + 24, content_y), "Sharing our beautiful Mien traditions", fill=CHARCOAL, font=fonts['small'])
    draw.text((x + 24, content_y + 28), "with the world. So grateful for this", fill=CHARCOAL, font=fonts['small'])
    draw.text((x + 24, content_y + 56), "amazing community!", fill=CHARCOAL, font=fonts['small'])

    # Image placeholder
    img_y = content_y + 100
    img_height = 280
    draw.rounded_rectangle([x + 24, img_y, x + width - 24, img_y + img_height], radius=16, fill=SOFT_GRAY)

    # Decorative pattern in image area
    pattern_cx = x + width // 2
    pattern_cy = img_y + img_height // 2
    draw_stepped_diamond(draw, pattern_cx, pattern_cy, 40, LIGHT_GRAY, steps=5)

    # Action buttons
    action_y = img_y + img_height + 20

    # Like button
    draw.ellipse([x + 24, action_y, x + 64, action_y + 40], outline=SILVER, width=2)
    draw_stepped_diamond(draw, x + 44, action_y + 20, 10, SILVER, steps=2)
    draw.text((x + 74, action_y + 8), "24", fill=SILVER, font=fonts['small'])

    # Comment button
    draw.ellipse([x + 120, action_y, x + 160, action_y + 40], outline=SILVER, width=2)
    draw.text((x + 170, action_y + 8), "8", fill=SILVER, font=fonts['small'])

    # Share button
    draw.ellipse([x + 220, action_y, x + 260, action_y + 40], outline=SILVER, width=2)

def create_story_bubble(draw, x, y, size, color, has_story=True, fonts=None, label=""):
    """Create a story/highlight bubble"""
    # Outer ring (gradient effect with multiple circles)
    if has_story:
        draw.ellipse([x - 3, y - 3, x + size + 3, y + size + 3], outline=DEEP_RED, width=3)

    # Inner circle (avatar)
    draw.ellipse([x + 4, y + 4, x + size - 4, y + size - 4], fill=SOFT_GRAY)

    # Diamond pattern in avatar
    draw_stepped_diamond(draw, x + size // 2, y + size // 2, size // 6, color, steps=2)

    # Label
    if label and fonts:
        bbox = draw.textbbox((0, 0), label, font=fonts['tiny'])
        label_width = bbox[2] - bbox[0]
        draw.text((x + size // 2 - label_width // 2, y + size + 8), label, fill=SILVER, font=fonts['tiny'])

def main():
    # Create canvas
    img = Image.new('RGB', (WIDTH, HEIGHT), CREAM)
    draw = ImageDraw.Draw(img)

    # Load fonts
    try:
        fonts = {
            'title': ImageFont.truetype(f"{FONT_DIR}/InstrumentSerif-Regular.ttf", 32),
            'header': ImageFont.truetype(f"{FONT_DIR}/WorkSans-Bold.ttf", 28),
            'button': ImageFont.truetype(f"{FONT_DIR}/WorkSans-Bold.ttf", 20),
            'body': ImageFont.truetype(f"{FONT_DIR}/WorkSans-Regular.ttf", 18),
            'small': ImageFont.truetype(f"{FONT_DIR}/WorkSans-Regular.ttf", 16),
            'tiny': ImageFont.truetype(f"{FONT_DIR}/WorkSans-Regular.ttf", 13),
        }
    except:
        default_font = ImageFont.load_default()
        fonts = {k: default_font for k in ['title', 'header', 'button', 'body', 'small', 'tiny']}

    # === STATUS BAR ===
    status_bar_height = 50
    draw.rectangle([0, 0, WIDTH, status_bar_height], fill=CREAM)
    # Time
    draw.text((50, 15), "9:41", fill=CHARCOAL, font=fonts['button'])
    # Status icons (right side)
    draw.text((WIDTH - 120, 15), "100%", fill=CHARCOAL, font=fonts['tiny'])

    # === HEADER ===
    header_y = status_bar_height
    header_height = 80

    # App title with decorative element
    title_x = 40
    draw_stepped_diamond(draw, title_x + 10, header_y + header_height // 2, 12, DEEP_RED, steps=2)
    draw.text((title_x + 35, header_y + 22), "Mien Kingdom", fill=CHARCOAL, font=fonts['title'])

    # Header icons (right side)
    icon_y = header_y + header_height // 2

    # Notification icon
    draw.ellipse([WIDTH - 140, icon_y - 18, WIDTH - 104, icon_y + 18], outline=CHARCOAL, width=2)
    # Notification badge
    draw.ellipse([WIDTH - 112, icon_y - 22, WIDTH - 98, icon_y - 8], fill=DEEP_RED)

    # Search icon
    draw.ellipse([WIDTH - 80, icon_y - 15, WIDTH - 50, icon_y + 15], outline=CHARCOAL, width=2)
    draw.line([(WIDTH - 52, icon_y + 12), (WIDTH - 40, icon_y + 24)], fill=CHARCOAL, width=2)

    # === STORIES ROW ===
    stories_y = header_y + header_height + 10
    stories_height = 130

    # Background
    draw.rectangle([0, stories_y, WIDTH, stories_y + stories_height], fill=WARM_WHITE)

    # "Your Story" bubble
    story_size = 80
    story_x = 30
    create_story_bubble(draw, story_x, stories_y + 15, story_size, SILVER, has_story=False, fonts=fonts, label="Your Story")

    # Add icon on "Your Story"
    add_size = 24
    add_x = story_x + story_size - add_size // 2
    add_y = stories_y + 15 + story_size - add_size // 2
    draw.ellipse([add_x, add_y, add_x + add_size, add_y + add_size], fill=DEEP_RED)
    draw.line([(add_x + 6, add_y + add_size // 2), (add_x + add_size - 6, add_y + add_size // 2)], fill=WARM_WHITE, width=2)
    draw.line([(add_x + add_size // 2, add_y + 6), (add_x + add_size // 2, add_y + add_size - 6)], fill=WARM_WHITE, width=2)

    # Other stories
    story_labels = ["Mai", "Seng", "Fong", "Lee", "Xai", "Kao"]
    for i, label in enumerate(story_labels):
        sx = 140 + i * 100
        create_story_bubble(draw, sx, stories_y + 15, story_size, DEEP_RED, has_story=True, fonts=fonts, label=label)

    # === FEED TABS ===
    tabs_y = stories_y + stories_height + 15
    tabs_height = 50

    # "For You" tab (active)
    tab_width = 150
    draw.rounded_rectangle([40, tabs_y, 40 + tab_width, tabs_y + tabs_height], radius=25, fill=DEEP_RED)
    bbox = draw.textbbox((0, 0), "For You", font=fonts['button'])
    tw = bbox[2] - bbox[0]
    draw.text((40 + tab_width // 2 - tw // 2, tabs_y + 13), "For You", fill=WARM_WHITE, font=fonts['button'])

    # "Following" tab
    draw.rounded_rectangle([200, tabs_y, 200 + tab_width, tabs_y + tabs_height], radius=25, outline=LIGHT_GRAY, width=2)
    bbox = draw.textbbox((0, 0), "Following", font=fonts['button'])
    tw = bbox[2] - bbox[0]
    draw.text((200 + tab_width // 2 - tw // 2, tabs_y + 13), "Following", fill=SILVER, font=fonts['button'])

    # "Trending" tab
    draw.rounded_rectangle([360, tabs_y, 360 + tab_width, tabs_y + tabs_height], radius=25, outline=LIGHT_GRAY, width=2)
    bbox = draw.textbbox((0, 0), "Trending", font=fonts['button'])
    tw = bbox[2] - bbox[0]
    draw.text((360 + tab_width // 2 - tw // 2, tabs_y + 13), "Trending", fill=SILVER, font=fonts['button'])

    # === POST CARDS ===
    feed_y = tabs_y + tabs_height + 20
    card_margin = 30
    card_width = WIDTH - card_margin * 2
    card_height = 520

    # First post card
    create_post_card(draw, card_margin, feed_y, card_width, card_height, fonts)

    # Second post card (partial, scrolled)
    second_card_y = feed_y + card_height + 20
    create_post_card(draw, card_margin, second_card_y, card_width, card_height, fonts)

    # === FLOATING ACTION BUTTON ===
    fab_size = 70
    fab_x = WIDTH - fab_size - 40
    fab_y = HEIGHT - 280

    # Shadow
    draw.ellipse([fab_x + 4, fab_y + 4, fab_x + fab_size + 4, fab_y + fab_size + 4], fill=(200, 200, 200))
    # Button
    draw.ellipse([fab_x, fab_y, fab_x + fab_size, fab_y + fab_size], fill=DEEP_RED)
    # Plus icon
    plus_margin = 22
    draw.line([(fab_x + plus_margin, fab_y + fab_size // 2), (fab_x + fab_size - plus_margin, fab_y + fab_size // 2)], fill=WARM_WHITE, width=4)
    draw.line([(fab_x + fab_size // 2, fab_y + plus_margin), (fab_x + fab_size // 2, fab_y + fab_size - plus_margin)], fill=WARM_WHITE, width=4)

    # === BOTTOM NAVIGATION ===
    nav_height = 100
    nav_y = HEIGHT - nav_height

    # Background with subtle top border
    draw.rectangle([0, nav_y, WIDTH, HEIGHT], fill=WARM_WHITE)
    draw.line([(0, nav_y), (WIDTH, nav_y)], fill=LIGHT_GRAY, width=1)

    # Navigation items
    nav_items = ["Home", "Explore", "Translate", "AI Tools", "Profile"]
    nav_spacing = WIDTH // len(nav_items)
    nav_icon_y = nav_y + 25

    for i, item in enumerate(nav_items):
        nx = nav_spacing * i + nav_spacing // 2
        is_active = i == 0  # Home is active

        icon_color = DEEP_RED if is_active else SILVER
        text_color = DEEP_RED if is_active else SILVER

        # Icon area
        icon_size = 24
        if i == 0:  # Home
            # House shape
            points = [
                (nx, nav_icon_y - icon_size),
                (nx + icon_size, nav_icon_y),
                (nx + icon_size * 0.6, nav_icon_y),
                (nx + icon_size * 0.6, nav_icon_y + icon_size * 0.8),
                (nx - icon_size * 0.6, nav_icon_y + icon_size * 0.8),
                (nx - icon_size * 0.6, nav_icon_y),
                (nx - icon_size, nav_icon_y),
            ]
            draw.polygon(points, fill=icon_color if is_active else None, outline=icon_color, width=2)
        elif i == 1:  # Explore
            draw.ellipse([nx - icon_size * 0.7, nav_icon_y - icon_size * 0.7, nx + icon_size * 0.5, nav_icon_y + icon_size * 0.5], outline=icon_color, width=3)
            draw.line([(nx + icon_size * 0.3, nav_icon_y + icon_size * 0.3), (nx + icon_size, nav_icon_y + icon_size)], fill=icon_color, width=3)
        elif i == 2:  # Translate
            draw.text((nx - 12, nav_icon_y - icon_size), "A", fill=icon_color, font=fonts['button'])
        elif i == 3:  # AI Tools
            draw_stepped_diamond(draw, nx, nav_icon_y, icon_size, icon_color, steps=3)
        elif i == 4:  # Profile
            draw.ellipse([nx - icon_size * 0.5, nav_icon_y - icon_size * 0.8, nx + icon_size * 0.5, nav_icon_y + icon_size * 0.2], outline=icon_color, width=2)
            draw.ellipse([nx - icon_size * 0.3, nav_icon_y + icon_size * 0.3, nx + icon_size * 0.3, nav_icon_y + icon_size * 0.9], outline=icon_color, width=2)

        # Label
        bbox = draw.textbbox((0, 0), item, font=fonts['tiny'])
        label_width = bbox[2] - bbox[0]
        draw.text((nx - label_width // 2, nav_icon_y + icon_size + 12), item, fill=text_color, font=fonts['tiny'])

    # Active indicator dot
    active_dot_x = nav_spacing // 2
    draw.ellipse([active_dot_x - 3, nav_y + 8, active_dot_x + 3, nav_y + 14], fill=DEEP_RED)

    # === HOME INDICATOR (iOS style) ===
    indicator_width = 140
    indicator_x = WIDTH // 2 - indicator_width // 2
    draw.rounded_rectangle([indicator_x, HEIGHT - 20, indicator_x + indicator_width, HEIGHT - 14], radius=3, fill=CHARCOAL)

    # === SAVE ===
    output_path = "/Users/jsaeliew/Library/CloudStorage/GoogleDrive-jai@mcya.org/Other computers/Work Laptop/files/Business/Apps/mienkingdom/design/mien-kingdom-main-ui.png"
    img.save(output_path, 'PNG', quality=95)
    print(f"Design saved to: {output_path}")

    return output_path

if __name__ == "__main__":
    main()
