"""
Test WelcomeScreen with completely fresh browser profile
"""
from playwright.sync_api import sync_playwright
import tempfile
import os

def test_welcome():
    print("Testing WelcomeScreen with fresh browser profile...")

    with sync_playwright() as p:
        # Create a temporary directory for browser data
        with tempfile.TemporaryDirectory() as user_data_dir:
            print(f"Using fresh profile at: {user_data_dir}")

            # Launch browser with fresh user data directory
            browser = p.chromium.launch_persistent_context(
                user_data_dir,
                headless=True,
                viewport={"width": 390, "height": 844},
            )
            page = browser.pages[0] if browser.pages else browser.new_page()

            url = "http://localhost:8081"
            print(f"Loading {url} with fresh profile (no stored auth)...")

            try:
                page.goto(url, timeout=120000, wait_until="networkidle")

                # Wait longer for React/Expo to initialize
                print("Waiting for app to render...")
                page.wait_for_timeout(8000)

                # Take screenshot
                screenshot_path = "/tmp/welcome-fresh.png"
                page.screenshot(path=screenshot_path, full_page=True)
                print(f"Screenshot saved to {screenshot_path}")

                # Check HTML content
                html = page.content()
                print(f"HTML length: {len(html)}")

                # Check for welcome screen content
                checks = {
                    "Continue with Google": "Google button",
                    "Connect with your community": "Tagline",
                    "Mien Kingdom": "Title",
                    "Community": "Features",
                    "Terms": "Footer",
                }

                print("\n=== Welcome Screen Check ===")
                found_count = 0
                for text, label in checks.items():
                    if text in html:
                        print(f"  ✓ {label}")
                        found_count += 1
                    else:
                        print(f"  ✗ {label}")

                if found_count >= 3:
                    print(f"\n✓ Welcome screen detected! ({found_count}/5 elements)")
                else:
                    # Show what we do have
                    body_text = page.evaluate("document.body.innerText")
                    print(f"\nBody text preview:\n{body_text[:500]}")

            except Exception as e:
                print(f"Error: {e}")
                import traceback
                traceback.print_exc()
                try:
                    page.screenshot(path="/tmp/welcome-fresh-error.png")
                except:
                    pass

            browser.close()
            print("\nDone!")

if __name__ == "__main__":
    test_welcome()
