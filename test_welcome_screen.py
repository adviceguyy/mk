"""
Test the redesigned WelcomeScreen by clearing session
"""
from playwright.sync_api import sync_playwright

def test_welcome_screen():
    print("Testing redesigned WelcomeScreen...")

    with sync_playwright() as p:
        # Launch with a fresh context (no stored data)
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 390, "height": 844},  # iPhone 14 Pro
            storage_state=None  # Fresh state, no cookies/storage
        )
        page = context.new_page()

        url = "http://localhost:8081"
        print(f"Navigating to {url} with fresh session...")

        try:
            # Clear any existing storage before navigating
            page.goto(url, timeout=60000)

            # Clear localStorage and sessionStorage
            page.evaluate("""() => {
                localStorage.clear();
                sessionStorage.clear();
            }""")

            # Reload to get the welcome screen
            print("Cleared storage, reloading...")
            page.reload(timeout=60000)
            page.wait_for_load_state('networkidle', timeout=60000)

            # Wait for React to render
            page.wait_for_timeout(4000)

            # Take screenshot
            screenshot_path = "/tmp/mien-kingdom-welcome-screen.png"
            page.screenshot(path=screenshot_path, full_page=True)
            print(f"Screenshot saved to: {screenshot_path}")

            # Check for welcome screen content
            body_text = page.locator("body").text_content() or ""
            print(f"Content length: {len(body_text)} chars")

            # Look for welcome screen indicators
            checks = []

            if "Mien Kingdom" in body_text:
                checks.append("✓ 'Mien Kingdom' title found")

            if "Connect with your community" in body_text:
                checks.append("✓ Tagline found")

            if "Google" in body_text or "Continue" in body_text:
                checks.append("✓ Sign-in button found")

            if "Community" in body_text and "Culture" in body_text:
                checks.append("✓ Feature highlights found")

            if "Terms" in body_text or "Privacy" in body_text:
                checks.append("✓ Footer links found")

            print("\n=== Welcome Screen Check ===")
            for check in checks:
                print(f"  {check}")

            if len(checks) >= 3:
                print("\n✓ Welcome screen is displaying correctly!")
            else:
                print(f"\nVisible text preview: {body_text[:300]}...")

        except Exception as e:
            print(f"Error: {e}")
            try:
                page.screenshot(path="/tmp/mien-kingdom-welcome-error.png")
                print("Error screenshot saved")
            except:
                pass

        context.close()
        browser.close()
        print("\nTest completed!")

if __name__ == "__main__":
    test_welcome_screen()
