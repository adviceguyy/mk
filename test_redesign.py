"""
Test the redesigned Mien Kingdom UI
"""
from playwright.sync_api import sync_playwright
import sys

def test_redesign():
    print("Testing redesigned Mien Kingdom UI...")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 390, "height": 844})  # iPhone 14 Pro size

        url = "http://localhost:8081"
        print(f"Navigating to {url}...")

        try:
            page.goto(url, timeout=60000)
            page.wait_for_load_state('networkidle', timeout=60000)
            print("Page loaded!")

            # Wait a bit more for React to render
            page.wait_for_timeout(3000)

            # Take screenshot
            screenshot_path = "/tmp/mien-kingdom-redesign.png"
            page.screenshot(path=screenshot_path, full_page=True)
            print(f"Screenshot saved to: {screenshot_path}")

            # Get page info
            title = page.title()
            print(f"Page title: {title}")

            # Check for content
            body_text = page.locator("body").text_content() or ""
            print(f"Body content length: {len(body_text)} chars")

            if "Mien Kingdom" in body_text:
                print("✓ 'Mien Kingdom' text found!")

            if "Connect with your community" in body_text:
                print("✓ Tagline found!")

            if "Google" in body_text:
                print("✓ Google sign-in button found!")

            print("\nRedesign test completed!")

        except Exception as e:
            print(f"Error: {e}")
            try:
                page.screenshot(path="/tmp/mien-kingdom-error.png")
                print("Error screenshot saved")
            except:
                pass

        browser.close()

if __name__ == "__main__":
    test_redesign()
