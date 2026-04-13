# Privacy Policy for Atlas Proxy Pro

Last updated: April 13, 2026

## 1. Overview

Atlas Proxy Pro is a Chrome extension for proxy switching, browser environment alignment, and network diagnostics.

The extension primarily works locally in your browser. Some diagnostic features send requests to a remote diagnostics endpoint so the extension can return IP, DNS, and risk-analysis results.

## 2. Data Processed Locally

The extension stores and processes the following data locally on your device by using Chrome extension storage:

- Proxy profiles and routing rules
- Selected mode, active node, bypass list
- Theme and language preferences
- Timezone and language override settings
- Cached diagnostic snapshots such as exit IP, country, city, timezone, and DNS results

This local data is used only to provide the extension's features.

## 3. Page Access and Browser Environment Checks

When you use selected diagnostics features, the extension may access the currently selected tab or a user-selected tab in order to:

- Read the tab URL and title for display inside the extension
- Check browser environment values such as timezone, language, WebRTC, WebGL, Canvas hash, screen size, viewport, and related browser capability signals
- Apply local timezone and language override behavior on pages

These checks are performed locally in the browser. The extension is not designed to collect page text, prompts, form input, cookies, or account credentials for remote transmission as part of normal diagnostics.

## 4. Remote Diagnostic Requests

When you manually run diagnostic features, the extension may send requests to a remote diagnostics endpoint to retrieve:

- Exit IP and geographic information
- IP reputation or trust score data
- DNS diagnostic data
- Network trace or reachability data

These requests may include your current exit IP address or the IP address being analyzed, because that is required to complete the diagnostic result.

The current build uses a remote diagnostics API endpoint defined in the extension code. If you deploy and use your own endpoint, your self-hosted service will process those requests instead.

## 5. Third-Party Services

Remote diagnostics may depend on third-party IP intelligence or abuse-detection providers. As a result, the IP being checked may be shared with those providers strictly for diagnostic purposes.

## 6. What We Do Not Intend to Collect

The extension is not intended to sell personal data.

The extension is not designed to transmit the following as part of its normal diagnostic flow:

- Claude prompts or conversation content
- Login cookies
- Account passwords
- Page form contents

## 7. Your Choices

You can:

- Avoid running manual diagnostics if you do not want remote checks
- Remove the extension at any time
- Clear extension storage by resetting or removing the extension

## 8. Contact

If you have questions about this policy, contact the developer through the project's published support channel or repository page.
