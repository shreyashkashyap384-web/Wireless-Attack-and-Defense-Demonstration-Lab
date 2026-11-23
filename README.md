# Wireless Attack & Defense Demonstration Lab (Interactive Sandbox)
## Live Simulation Guide

---

### 🎯 What This Project Actually Demonstrates
Unlike a static documentation site, this lab provides a **real-time visual simulation sandbox** demonstrating:
1. **How 802.11 Wi-Fi attacks execute at the frame level:** Visualizing unauthenticated frame injection, rogue beacon broadcasts, and PIN probes.
2. **How network defenses actively stop them:** Toggling router security switches (like 802.11w MFP, WPA3-SAE, WIDS) to see attacks **get dropped or blocked** in real-time.

---

### 🕹️ How to Use the Demonstration Sandbox

Open **[http://127.0.0.1:5000](http://127.0.0.1:5000)** in your browser.

```
┌────────────────────────────────────────────────────────────────────────┐
│                      VIRTUAL 802.11 RF TOPOLOGY                        │
│                                                                        │
│   [Target AP] ◄- - - - - - [Victim Client] ◄- - - - - [Attacker Rig]   │
│   (SSID / BSSID)            (Ping / Status)           (wlan0mon)       │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
┌───────────────────────────────────┬────────────────────────────────────┐
│      1. ATTACK CONTROLS           │     2. ROUTER DEFENSE SWITCHES     │
│  ○ Deauth Flood                   │  Mode: [ WPA2 ] vs [ WPA3-SAE ]    │
│  ○ Evil Twin / Rogue AP           │  [ Toggle ] 802.11w MFP            │
│  ○ WPS PIN Brute Force            │  [ Toggle ] WPS Enabled            │
│  ○ PMKID Hash Extraction          │  [ Toggle ] WIDS Rogue Sensor      │
│                                   │                                    │
│  [ ⚡ RUN ATTACK SIMULATION ]      │                                    │
└───────────────────────────────────┴────────────────────────────────────┘
┌───────────────────────────────────┬────────────────────────────────────┐
│  ATTACKER TERMINAL & LOGS         │  802.11 FRAME DISSECTOR & VERDICT  │
│  Live raw injection log stream    │  Header flags & Cryptographic MIC  │
└───────────────────────────────────┴────────────────────────────────────┘
```

---

### 🧪 4 Interactive Experiments to Try:

#### Experiment 1: Deauthentication Flood vs. 802.11w MFP
1. Keep **802.11w MFP toggle: OFF** and select **Deauthentication Flood**.
2. Click **Run Attack Simulation**:
   - Red packet bursts fly from the Attacker to the Victim.
   - Terminal logs injected deauth frames.
   - **Result:** Victim's status changes to `DISCONNECTED`, Ping drops to `TIMEOUT`, packet loss hits `100%`.
3. Now switch **802.11w MFP toggle: ON** (or switch to WPA3).
4. Click **Run Attack Simulation** again:
   - Green cryptographic shield activates over the client.
   - Malicious frames hit the shield and are dropped.
   - **Result:** Frame Dissector shows `MIC_STATUS: INVALID -> REJECTED`. Victim connection remains `ONLINE (PROTECTED)`.

#### Experiment 2: Evil Twin Rogue AP vs. WIDS Sensor
1. With **WIDS Sensor: OFF**, select **Evil Twin / Rogue AP** and click Run.
   - Attacker broadcasts rogue beacon with higher signal strength (+24dBm).
   - **Result:** Victim station roams to the rogue AP; attacker console intercepts plaintext traffic.
2. Turn **WIDS Sensor: ON** and run again.
   - Sensor detects BSSID anomaly. Roaming is blocked.

#### Experiment 3: WPS PIN Exhaustion vs. Disabling WPS
1. With **WPS: ACTIVE**, run **WPS PIN Brute Force**.
   - See how the 2-half flaw cracks digits in 11,000 queries instead of 100,000,000.
2. Turn **WPS: OFF** (or select WPA3-SAE).
   - Router drops EAP-WSC probes. Attack is mitigated.

#### Experiment 4: PMKID Extraction vs. WPA3 Dragonfly (SAE)
1. In **WPA2** mode, run **PMKID Offline Hash Extraction**.
   - Handshake hash is captured without client interaction.
2. Switch to **WPA3-SAE**.
   - Dragonfly handshake uses discrete logarithm zero-knowledge proof; no static PMKID hash exists to crack.
