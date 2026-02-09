"""
Test WelcomeScreen by clearing Mien Kingdom auth keys
"""
from playwright.sync_api import sync_playwright

def test_welcome():
    print("Testing WelcomeScreen with cleared auth...")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 390, "height": 844})
        page = context.new_page()

        url = "http://localhost:8081"
        print(f"Loading {url}...")

        try:
            page.goto(url, timeout=90000, wait_until="networkidle")
            page.wait_for_timeout(3000)

            # Clear specific Mien Kingdom auth keys
            print("Clearing auth storage keys...")
            page.evaluate("""() => {
                // Clear specific keys
                localStorage.removeItem('@mien_kingdom_auth');
                localStorage.removeItem('@mien_kingdom_session');

                // Also try clearing all localStorage
                localStorage.clear();
                sessionStorage.clear();

                // Clear IndexedDB if used
                if (window.indexedDB) {
                    indexedDB.deleteDatabase('RCTAsyncLocalStorage');
                    indexedDB.deleteDatabase('localforage');
                }
            }""")

            # Reload to trigger auth check
            print("Reloading page...")
            page.reload(timeout=90000, wait_until="networkidle")
            page.wait_for_timeout(5000)

            # Take screenshot
            page.screenshot(path="/tmp/welcome-clean.png", full_page=True)
            print("Screenshot saved to /tmp/welcome-clean.png")

            # Get page content
            html = page.content()
            print(f"HTML length: {len(html)}")

            # Check for welcome indicators in the HTML
            indicators = [
                ("Continue with Google", "Sign-in button"),
                ("Connect with your community", "Tagline"),
                ("Community", "Feature section"),
                ("Terms of Service", "Footer"),
            ]

            print("\n=== Content Check ===")
            for text, label in indicators:
                if text in html:
                    print(f"  ✓ {label}: Found")
                else:
                    print(f"  ✗ {label}: Not found")

        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()

        context.close()
        browser.close()
        print("\nDone!")

if __name__ == "__main__":
    test_welcome()
