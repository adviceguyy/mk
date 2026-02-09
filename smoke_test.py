"""
Smoke test for Mien Kingdom web app
Verifies the app loads correctly and basic elements render
"""
from playwright.sync_api import sync_playwright
import sys

def run_smoke_test():
    print("Starting smoke test...")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Try to load the web app (Expo web runs on port 8081)
        url = "http://localhost:8081"
        print(f"Navigating to {url}...")

        try:
            page.goto(url, timeout=60000)
            page.wait_for_load_state('networkidle', timeout=60000)
            print("Page loaded successfully!")

            # Take a screenshot
            screenshot_path = "/tmp/mienkingdom_smoke_test.png"
            page.screenshot(path=screenshot_path, full_page=True)
            print(f"Screenshot saved to: {screenshot_path}")

            # Get page title
            title = page.title()
            print(f"Page title: {title}")

            # Get page content for analysis
            content = page.content()

            # Check for common elements/text that should be present
            checks = []

            # Check if page has any visible content
            body_text = page.locator("body").text_content()
            if body_text and len(body_text.strip()) > 0:
                checks.append(("Page has content", True))
                print(f"Body content length: {len(body_text)} chars")
            else:
                checks.append(("Page has content", False))
                print("WARNING: Page appears empty")

            # Look for React app root
            react_root = page.locator("#root, #app, [data-reactroot]").count()
            if react_root > 0:
                checks.append(("React root found", True))
                print("React app root element found")
            else:
                checks.append(("React root found", False))
                print("No React root element found")

            # Check for any buttons or interactive elements
            buttons = page.locator("button, [role='button']").count()
            print(f"Found {buttons} button(s)")

            # Check for any links
            links = page.locator("a").count()
            print(f"Found {links} link(s)")

            # Check for any images
            images = page.locator("img").count()
            print(f"Found {images} image(s)")

            # Print all visible text (truncated)
            if body_text:
                preview = body_text[:500].replace('\n', ' ').strip()
                print(f"\nVisible text preview: {preview}...")

            # Summary
            print("\n=== SMOKE TEST SUMMARY ===")
            all_passed = True
            for check_name, passed in checks:
                status = "PASS" if passed else "FAIL"
                print(f"  [{status}] {check_name}")
                if not passed:
                    all_passed = False

            if all_passed:
                print("\nSmoke test PASSED!")
            else:
                print("\nSmoke test had issues - check screenshot for details")

        except Exception as e:
            print(f"Error during smoke test: {e}")
            # Take error screenshot if possible
            try:
                page.screenshot(path="/tmp/mienkingdom_error.png")
                print("Error screenshot saved to: /tmp/mienkingdom_error.png")
            except:
                pass
            browser.close()
            sys.exit(1)

        browser.close()
        print("\nSmoke test completed!")

if __name__ == "__main__":
    run_smoke_test()
