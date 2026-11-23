"""
Wireless Attack-and-Defense Demonstration Lab (WADL)
Interactive Simulation Engine Backend
"""

from flask import Flask, render_template, jsonify, request
import datetime

app = Flask(__name__)

SCENARIOS = {
    "deauth": {
        "id": "deauth",
        "name": "Deauthentication Flood",
        "category": "Denial of Service & Handshake Capture",
        "description": "Attacker injects forged 802.11 Deauth frames with the AP's spoofed MAC address to disconnect the victim.",
        "target": "Victim Station",
        "primary_defense": "802.11w Management Frame Protection (MFP)",
        "vulnerability_standard": "IEEE 802.11-2007 (Management frames sent in plaintext with no cryptographic MIC)."
    },
    "evil-twin": {
        "id": "evil-twin",
        "name": "Evil Twin / Rogue AP",
        "category": "Man-In-The-Middle (MITM)",
        "description": "Attacker broadcasts an identical SSID with boosted transmission power to trick client roaming.",
        "target": "Victim Station",
        "primary_defense": "WIDS BSSID Verification / WPA3-Enterprise (802.1X Certs)",
        "vulnerability_standard": "802.11 roaming prefers highest RSSI when SSID matches, ignoring BSSID authenticity."
    },
    "wps": {
        "id": "wps",
        "name": "WPS PIN Brute Force (2-Half Flaw)",
        "category": "Authentication Bypass",
        "description": "Exploiting the 8-digit WPS PIN design flaw that validates first 4 and second 4 digits separately (11,000 attempts total).",
        "target": "Access Point",
        "primary_defense": "Disable WPS / Upgrade to WPA3-SAE",
        "vulnerability_standard": "Wi-Fi Protected Setup (WPS) EAP-WSC protocol design defect."
    },
    "pmkid": {
        "id": "pmkid",
        "name": "PMKID Offline Hash Capture",
        "category": "Credential Extraction",
        "description": "Extracting the PMKID hash directly from the first EAPOL frame without waiting for client authentication.",
        "target": "Access Point",
        "primary_defense": "WPA3 Simultaneous Authentication of Equals (SAE)",
        "vulnerability_standard": "WPA2 4-Way Handshake PMK derivation (HMAC-SHA1(PMK, 'PMK Name' + AP_MAC + Station_MAC))."
    }
}

@app.route("/")
def index():
    return render_template("index.html", scenarios=SCENARIOS)

@app.route("/api/scenarios")
def get_scenarios():
    return jsonify(SCENARIOS)

@app.route("/api/run-simulation", methods=["POST"])
def run_simulation():
    data = request.json or {}
    attack_type = data.get("attack_type", "deauth")
    defenses = data.get("defenses", {})

    scenario = SCENARIOS.get(attack_type, SCENARIOS["deauth"])
    
    if attack_type == "deauth":
        if defenses.get("mfp") or defenses.get("wpa_mode") == "wpa3":
            outcome = {
                "success": False,
                "status": "BLOCKED_BY_DEFENSE",
                "headline": "Attack Mitigated: 802.11w Management Frame Protection Active",
                "explanation": "The victim client and AP negotiate BIP (Broadcast Integrity Protocol) using AES-CMAC. The spoofed Deauth frames lacked the valid cryptographic MIC key and were silently discarded at the PHY/MAC driver level.",
                "packet_sample": {
                    "type": "802.11 Deauthentication (0x000c)",
                    "source_mac": "02:00:00:00:00:01 (Spoofed AP)",
                    "dest_mac": "A0:B1:C2:D3:E4:F5 (Victim)",
                    "protected_flag": "1 (Required)",
                    "mic_status": "INVALID_OR_MISSING -> FRAME REJECTED"
                }
            }
        else:
            outcome = {
                "success": True,
                "status": "ATTACK_SUCCESSFUL",
                "headline": "Attack Succeeded: Client Disconnected via Spoofed Deauth",
                "explanation": "Because 802.11w (MFP) was disabled, the client accepted unauthenticated deauthentication frames originating from the attacker, resulting in instantaneous denial-of-service and forced handshake renegotiation.",
                "packet_sample": {
                    "type": "802.11 Deauthentication (0x000c)",
                    "source_mac": "02:00:00:00:00:01 (Spoofed AP)",
                    "dest_mac": "A0:B1:C2:D3:E4:F5 (Victim)",
                    "protected_flag": "0 (Unprotected)",
                    "mic_status": "NONE -> ACCEPTED WITHOUT CHECK"
                }
            }

    elif attack_type == "evil-twin":
        if defenses.get("wids_enabled"):
            outcome = {
                "success": False,
                "status": "BLOCKED_BY_DEFENSE",
                "headline": "Attack Mitigated: Rogue AP Detected by Client Sensor",
                "explanation": "Client WIDS sensor identified a secondary AP broadcasting identical SSID 'Lab-Secure-AP' with an unrecognized BSSID (00:11:22:33:44:55) and abnormal RSSI spike (+18dBm). Roaming connection was refused.",
                "packet_sample": {
                    "type": "802.11 Beacon Frame (0x0008)",
                    "source_mac": "00:11:22:33:44:55 (Rogue BSSID)",
                    "ssid": "Lab-Secure-AP",
                    "channel": "6",
                    "wids_verdict": "MISMATCHED BSSID / ANOMALY DETECTED"
                }
            }
        else:
            outcome = {
                "success": True,
                "status": "ATTACK_SUCCESSFUL",
                "headline": "Attack Succeeded: Victim Associated with Rogue AP",
                "explanation": "Victim's Wi-Fi driver selected the higher signal strength rogue AP (+24dBm vs +12dBm). Attacker launched a fake captive portal / SSL stripping proxy to intercept credentials in plaintext.",
                "packet_sample": {
                    "type": "802.11 Association Request (0x0000)",
                    "source_mac": "A0:B1:C2:D3:E4:F5 (Victim)",
                    "dest_mac": "00:11:22:33:44:55 (Attacker AP)",
                    "status": "ASSOCIATED / TRAFFIC HIJACKED"
                }
            }

    elif attack_type == "wps":
        if not defenses.get("wps_enabled") or defenses.get("wpa_mode") == "wpa3":
            outcome = {
                "success": False,
                "status": "BLOCKED_BY_DEFENSE",
                "headline": "Attack Mitigated: WPS Disabled / WPA3 Mandatory",
                "explanation": "WPS functionality is completely disabled on the Access Point (mandatory in WPA3). Pin-probing M1/M2 exchanges return NACK/Drop, stopping the 11,000-combination split-bruteforce attack.",
                "packet_sample": {
                    "type": "EAP-WSC M1 Probe",
                    "source_mac": "00:11:22:33:44:55 (Attacker)",
                    "dest_mac": "02:00:00:00:00:01 (AP)",
                    "response": "EAP-FAIL / FEATURE_DISABLED"
                }
            }
        else:
            outcome = {
                "success": True,
                "status": "ATTACK_SUCCESSFUL",
                "headline": "Attack Succeeded: PIN Recovered in Two Halves",
                "explanation": "Router verified first 4 digits ('4128') with EAP-NACK after half-attempt, shrinking search space. Second half ('763') cracked within seconds. WPA2 Passphrase extracted directly.",
                "packet_sample": {
                    "type": "EAP-WSC M4 Message Exchange",
                    "first_half": "4128 [CORRECT]",
                    "second_half": "7631 [CORRECT]",
                    "extracted_key": "CyberLab2026!"
                }
            }

    elif attack_type == "pmkid":
        if defenses.get("wpa_mode") == "wpa3":
            outcome = {
                "success": False,
                "status": "BLOCKED_BY_DEFENSE",
                "headline": "Attack Mitigated: WPA3 Dragonfly (SAE) Zero-Knowledge Proof",
                "explanation": "WPA3 uses Simultaneous Authentication of Equals (SAE) with discrete logarithm cryptography. No PMKID hash is transmitted in beacon/EAPOL frames, making offline dictionary cracking mathematically impossible.",
                "packet_sample": {
                    "type": "802.11 Authentication Frame",
                    "algorithm": "SAE (Dragonfly)",
                    "pmkid_present": "NO (No static hash exposure)",
                    "offline_crackability": "IMPOSSIBLE (Forward Secrecy)"
                }
            }
        else:
            outcome = {
                "success": True,
                "status": "ATTACK_SUCCESSFUL",
                "headline": "Attack Succeeded: PMKID Extracted for Offline Cracking",
                "explanation": "Captured PMKID tag from AP's first RSN IE frame without requiring any client to be active. Attacker fed hash into offline wordlist generator, successfully uncovering WPA2 Pre-Shared Key.",
                "packet_sample": {
                    "type": "EAPOL Key Frame (Message 1 of 4)",
                    "pmkid_hash": "a4d3f89e210bc8720194e82b71fa0092",
                    "cracking_method": "Offline dictionary attack against PBKDF2"
                }
            }

    return jsonify({
        "timestamp": datetime.datetime.now().strftime("%H:%M:%S"),
        "scenario": scenario,
        "defenses_state": defenses,
        "outcome": outcome
    })

if __name__ == "__main__":
    app.run(debug=True)
