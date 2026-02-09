"""
Test WelcomeScreen with console logging
"""
from playwright.sync_api import sync_playwright

def test_welcome():
    print("Testing WelcomeScreen...")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 390, "height": 844},
            java_script_enabled=True,
        )
        page = context.new_page()

        # Collect console messages
        console_messages = []
        page.on("console", lambda msg: console_messages.append(f"{msg.type}: {msg.text}"))
        page.on("pageerror", lambda err: console_messages.append(f"ERROR: {err}"))

        url = "http://localhost:8081"
        print(f"Loading {url}...")

        try:
            page.goto(url, timeout=90000, wait_until="networkidle")

            # Clear storage
            page.evaluate("localStorage.clear(); sessionStorage.clear();")

            # Reload
            page.reload(timeout=90000, wait_until="networkidle")

            # Wait for app to render
            print("Waiting for React app to render...")
            page.wait_for_timeout(8000)

            # Try to find React root
            react_content = page.evaluate("""() => {
                const root = document.getElementById('root');
                if (root) {
                    return {
                        hasContent: root.innerHTML.length > 100,
                        childCount: root.childElementCount,
                        innerLength: root.innerHTML.length
                    };
                }
                return null;
            }""")
            print(f"React root: {react_content}")

            # Screenshot
            page.screenshot(path="/tmp/welcome-v2.png", full_page=True)
            print("Screenshot saved to /tmp/welcome-v2.png")

            # Show console errors
            errors = [m for m in console_messages if "error" in m.lower() or "ERROR" in m]
            if errors:
                print("\n=== Console Errors ===")
                for e in errors[:10]:
                    print(f"  {e[:200]}")

            # Get visible text
            text = page.locator("body").text_content() or ""
            print(f"\nVisible text ({len(text)} chars): {text[:500]}")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/tmp/welcome-error-v2.png")

        context.close()
        browser.close()

if __name__ == "__main__":
    test_welcome()
