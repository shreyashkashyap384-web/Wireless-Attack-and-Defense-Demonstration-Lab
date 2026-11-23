// WADL Interactive Simulation Engine

let isSimulating = false;
let packetAnimationInterval = null;

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  setupScenarioOptions();
  updateDefenses();
  startIdleTraffic();
});

// Setup scenario radio clicking styling
function setupScenarioOptions() {
  const options = document.querySelectorAll(".scenario-option");
  options.forEach(opt => {
    opt.addEventListener("click", () => {
      options.forEach(o => o.classList.remove("selected"));
      opt.classList.add("selected");
      const radio = opt.querySelector("input[type='radio']");
      if (radio) radio.checked = true;
    });
  });

  // Segmented control styling
  const segments = document.querySelectorAll(".segmented-control .segment");
  segments.forEach(seg => {
    seg.addEventListener("click", () => {
      segments.forEach(s => s.classList.remove("active"));
      seg.classList.add("active");
    });
  });
}

// Read current defense configuration from UI
function getDefenses() {
  const wpaModeRadio = document.querySelector("input[name='wpa_mode']:checked");
  const wpaMode = wpaModeRadio ? wpaModeRadio.value : "wpa2";
  const mfp = document.getElementById("toggle-mfp").checked;
  const wps = document.getElementById("toggle-wps").checked;
  const wids = document.getElementById("toggle-wids").checked;

  return {
    wpa_mode: wpaMode,
    mfp: mfp,
    wps_enabled: wps,
    wids_enabled: wids
  };
}

// Update badges on the AP topology node
function updateDefenses() {
  const def = getDefenses();
  const badgeSec = document.getElementById("badge-ap-security");
  const badgeMfp = document.getElementById("badge-ap-mfp");
  const badgeWps = document.getElementById("badge-ap-wps");

  if (def.wpa_mode === "wpa3") {
    badgeSec.textContent = "WPA3-SAE (Dragonfly)";
    badgeSec.className = "env-badge badge-active";
    // WPA3 mandates MFP and disables WPS
    badgeMfp.textContent = "MFP: MANDATORY (ON)";
    badgeMfp.className = "env-badge badge-active";
    badgeWps.textContent = "WPS: DISABLED";
    badgeWps.className = "env-badge badge-dim";
  } else {
    badgeSec.textContent = "WPA2-PSK (AES)";
    badgeSec.className = "env-badge";

    if (def.mfp) {
      badgeMfp.textContent = "MFP: 802.11w ACTIVE";
      badgeMfp.className = "env-badge badge-active";
    } else {
      badgeMfp.textContent = "MFP: DISABLED";
      badgeMfp.className = "env-badge badge-dim";
    }

    if (def.wps_enabled) {
      badgeWps.textContent = "WPS: ACTIVE";
      badgeWps.className = "env-badge badge-warn";
    } else {
      badgeWps.textContent = "WPS: DISABLED";
      badgeWps.className = "env-badge badge-dim";
    }
  }
}

// Subtle background idle Wi-Fi heartbeat pulses between AP and Victim
function startIdleTraffic() {
  const layer = document.getElementById("packet-layer");
  if (!layer) return;

  setInterval(() => {
    if (isSimulating) return;
    spawnPacket(180, 120, 400, 120, "#10b981", 1200, 3);
  }, 1600);
}

// Animate a single packet circle along coordinates
function spawnPacket(x1, y1, x2, y2, color, durationMs, radius = 4) {
  const layer = document.getElementById("packet-layer");
  if (!layer) return;

  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("r", radius);
  circle.setAttribute("fill", color);

  const anim = document.createElementNS("http://www.w3.org/2000/svg", "animateTransform");
  anim.setAttribute("attributeName", "transform");
  anim.setAttribute("type", "translate");
  anim.setAttribute("from", `${x1} ${y1}`);
  anim.setAttribute("to", `${x2} ${y2}`);
  anim.setAttribute("dur", `${durationMs}ms`);
  anim.setAttribute("fill", "freeze");

  circle.appendChild(anim);
  layer.appendChild(circle);

  setTimeout(() => {
    if (layer.contains(circle)) layer.removeChild(circle);
  }, durationMs);
}

// Append a line to terminal log
function logTerminal(text, type = "info") {
  const term = document.getElementById("terminal-output");
  if (!term) return;

  const line = document.createElement("div");
  line.className = `term-line term-${type}`;
  const time = new Date().toTimeString().split(" ")[0];
  line.textContent = `[${time}] ${text}`;
  term.appendChild(line);
  term.scrollTop = term.scrollHeight;
}

// Clear terminal
function clearTerminal() {
  const term = document.getElementById("terminal-output");
  if (term) term.innerHTML = "";
}

// Launch the defensive simulation (auto-applies and verifies countermeasure)
async function launchDefenseSimulation() {
  if (isSimulating) return;

  const attackRadio = document.querySelector("input[name='attack_scenario']:checked");
  const attackType = attackRadio ? attackRadio.value : "deauth";

  // Auto-enable the corresponding defense mechanism for visual clarity
  const toggleMfp = document.getElementById("toggle-mfp");
  const toggleWps = document.getElementById("toggle-wps");
  const toggleWids = document.getElementById("toggle-wids");
  const wpa3Radio = document.querySelector("input[name='wpa_mode'][value='wpa3']");

  if (attackType === "deauth") {
    toggleMfp.checked = true;
    logTerminal(`[Defense Console] Enforcing 802.11w Management Frame Protection (MFP: ON)`, "safe");
  } else if (attackType === "evil-twin") {
    toggleWids.checked = true;
    logTerminal(`[Defense Console] Activating Wireless Intrusion Detection Sensor (WIDS: ON)`, "safe");
  } else if (attackType === "wps") {
    toggleWps.checked = false;
    logTerminal(`[Defense Console] Disabling vulnerable Wi-Fi Protected Setup (WPS: OFF)`, "safe");
  } else if (attackType === "pmkid") {
    if (wpa3Radio) {
      wpa3Radio.checked = true;
      const segments = document.querySelectorAll(".segmented-control .segment");
      segments.forEach(s => s.classList.remove("active"));
      wpa3Radio.closest(".segment").classList.add("active");
    }
    logTerminal(`[Defense Console] Upgrading AP to WPA3-SAE (Dragonfly Zero-Knowledge Handshake)`, "safe");
  }

  updateDefenses();

  const defBtn = document.getElementById("btn-launch-defense");
  if (defBtn) {
    defBtn.disabled = true;
    defBtn.textContent = "🛡️ VERIFYING DEFENSE INTERCEPTION...";
  }

  // Run the simulation with defensive engine active
  await launchSimulation();

  if (defBtn) {
    defBtn.disabled = false;
    defBtn.textContent = "🛡️ RUN DEFENSE SIMULATION (TEST MITIGATION)";
  }
}

// Launch the interactive simulation
async function launchSimulation() {
  if (isSimulating) return;
  isSimulating = true;

  const btn = document.getElementById("btn-launch-attack");
  const defBtn = document.getElementById("btn-launch-defense");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "⏳ EXECUTING ATTACK...";
  }
  if (defBtn) {
    defBtn.disabled = true;
  }

  const attackRadio = document.querySelector("input[name='attack_scenario']:checked");
  const attackType = attackRadio ? attackRadio.value : "deauth";
  const defenses = getDefenses();

  // Reset visual states
  const shield = document.getElementById("shield-group");
  shield.setAttribute("opacity", "0");
  const victimPill = document.getElementById("node-victim-status");
  const attackerPill = document.getElementById("node-attacker-status");
  attackerPill.textContent = "TRANSMITTING";
  attackerPill.className = "node-state-pill pill-danger";

  logTerminal(`[Attacker] Initializing attack vector: ${attackType.toUpperCase()}`, "warn");
  logTerminal(`[Attacker] Binding raw 802.11 socket to wlan0mon on channel 6...`, "info");

  // Fire packet bursts along path
  let packetInterval = null;
  if (attackType === "deauth") {
    // Packets fly from Attacker -> Victim
    packetInterval = setInterval(() => {
      spawnPacket(620, 120, 400, 120, "#ef4444", 600, 5);
    }, 150);
  } else if (attackType === "evil-twin") {
    // Packets fly Attacker -> Victim
    packetInterval = setInterval(() => {
      spawnPacket(620, 120, 400, 120, "#f59e0b", 700, 5);
    }, 200);
  } else if (attackType === "wps" || attackType === "pmkid") {
    // Packets fly Attacker -> AP
    packetInterval = setInterval(() => {
      spawnPacket(620, 120, 180, 120, "#3b82f6", 700, 5);
    }, 200);
  }

  try {
    const res = await fetch("/api/run-simulation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attack_type: attackType,
        defenses: defenses
      })
    });

    const data = await res.json();

    // Step-by-step terminal delays for realistic visual feel
    setTimeout(() => {
      if (attackType === "deauth") {
        logTerminal(`[Attacker] Injecting spoofed 802.11 Deauth frames (AP BSSID: 02:00:00:00:00:01)...`, "warn");
      } else if (attackType === "evil-twin") {
        logTerminal(`[Attacker] Broadcasting rogue beacon for SSID 'Lab-Secure-AP' (+24dBm)...`, "warn");
      } else if (attackType === "wps") {
        logTerminal(`[Attacker] Sending EAP-WSC M1/M2 pin probe exchange against AP...`, "warn");
      } else if (attackType === "pmkid") {
        logTerminal(`[Attacker] Capturing initial RSN IE authentication frames from AP...`, "warn");
      }
    }, 600);

    setTimeout(() => {
      clearInterval(packetInterval);
      renderOutcome(data);
      isSimulating = false;
      if (btn) {
        btn.disabled = false;
        btn.textContent = "⚡ RUN ATTACK SIMULATION";
      }
      if (defBtn) {
        defBtn.disabled = false;
        defBtn.textContent = "🛡️ RUN DEFENSE SIMULATION (TEST MITIGATION)";
      }
    }, 1800);

  } catch (err) {
    console.error("Simulation request failed", err);
    clearInterval(packetInterval);
    isSimulating = false;
    if (btn) {
      btn.disabled = false;
      btn.textContent = "⚡ RUN ATTACK SIMULATION";
    }
    if (defBtn) {
      defBtn.disabled = false;
      defBtn.textContent = "🛡️ RUN DEFENSE SIMULATION (TEST MITIGATION)";
    }
    logTerminal(`Error running simulation: ${err.message}`, "danger");
  }
}

// Render the outcome on the nodes, terminal, and verdict panel
function renderOutcome(data) {
  const outcome = data.outcome;
  const victimPill = document.getElementById("node-victim-status");
  const attackerPill = document.getElementById("node-attacker-status");
  const victimPing = document.getElementById("victim-ping");
  const victimLoss = document.getElementById("victim-loss");
  const shield = document.getElementById("shield-group");
  const verdictTag = document.getElementById("verdict-tag");
  const verdictContent = document.getElementById("verdict-content");

  attackerPill.textContent = "STANDBY";
  attackerPill.className = "node-state-pill pill-idle";

  if (outcome.success) {
    // Attack Succeeded
    shield.setAttribute("opacity", "0");
    verdictTag.textContent = "EXPLOIT SUCCEEDED";
    verdictTag.className = "verdict-tag verdict-danger";

    if (data.scenario.id === "deauth") {
      victimPill.textContent = "DISCONNECTED";
      victimPill.className = "node-state-pill pill-danger";
      victimPing.textContent = "TIMEOUT";
      victimLoss.textContent = "100%";
      logTerminal(`[Victim] Disconnected by 802.11 Deauth (Reason Code 7: Class 3 frame received from nonassociated STA)`, "danger");
      logTerminal(`[Attacker] Victim successfully kicked off network. Handshake sniff triggered.`, "danger");
    } else if (data.scenario.id === "evil-twin") {
      victimPill.textContent = "ROAMED TO ROGUE AP";
      victimPill.className = "node-state-pill pill-danger";
      logTerminal(`[Victim] Associated with higher signal BSSID (00:11:22:33:44:55).`, "danger");
      logTerminal(`[Attacker] MITM established. Plaintext credentials intercepted.`, "danger");
    } else {
      victimPill.textContent = "AP COMPROMISED";
      victimPill.className = "node-state-pill pill-danger";
      logTerminal(`[Attacker] ${outcome.headline}`, "danger");
    }

    renderVerdictCard(outcome, false);

  } else {
    // Attack Mitigated / Blocked
    shield.setAttribute("opacity", "1");
    verdictTag.textContent = "MITIGATED BY DEFENSE";
    verdictTag.className = "verdict-tag verdict-safe";

    victimPill.textContent = "CONNECTED (PROTECTED)";
    victimPill.className = "node-state-pill pill-online";
    victimPing.textContent = "12 ms";
    victimLoss.textContent = "0%";

    logTerminal(`[Defense Engine] ${outcome.headline}`, "safe");
    logTerminal(`[AP/Client] Malicious frames discarded at MAC layer. Connection maintained.`, "safe");

    renderVerdictCard(outcome, true);
  }
}

// Populate the bottom-right frame inspection panel
function renderVerdictCard(outcome, isSafe) {
  const container = document.getElementById("verdict-content");
  if (!container) return;

  let packetHtml = "";
  if (outcome.packet_sample) {
    packetHtml = `<div class="packet-dissector">
      <div class="dissector-title">802.11 Frame Dissection:</div>
      <table class="packet-table">`;
    for (const [key, val] of Object.entries(outcome.packet_sample)) {
      const formattedKey = key.replace(/_/g, " ").toUpperCase();
      packetHtml += `<tr>
        <td class="col-key">${formattedKey}</td>
        <td class="col-val">${val}</td>
      </tr>`;
    }
    packetHtml += `</table></div>`;
  }

  container.innerHTML = `
    <div class="verdict-banner ${isSafe ? 'verdict-banner-safe' : 'verdict-banner-danger'}">
      <h4>${outcome.headline}</h4>
      <p class="verdict-exp">${outcome.explanation}</p>
    </div>
    ${packetHtml}
  `;
}

// Reset lab state
function resetLab() {
  isSimulating = false;
  const victimPill = document.getElementById("node-victim-status");
  const attackerPill = document.getElementById("node-attacker-status");
  const victimPing = document.getElementById("victim-ping");
  const victimLoss = document.getElementById("victim-loss");
  const shield = document.getElementById("shield-group");
  const verdictTag = document.getElementById("verdict-tag");
  const verdictContent = document.getElementById("verdict-content");

  victimPill.textContent = "CONNECTED";
  victimPill.className = "node-state-pill pill-online";
  attackerPill.textContent = "STANDBY";
  attackerPill.className = "node-state-pill pill-idle";
  victimPing.textContent = "12 ms";
  victimLoss.textContent = "0%";
  shield.setAttribute("opacity", "0");

  verdictTag.textContent = "IDLE";
  verdictTag.className = "verdict-tag verdict-idle";
  verdictContent.innerHTML = `
    <div class="empty-state">
      <p>No active simulation running.</p>
      <p class="text-dim">Trigger an attack above to observe frame exchange and mitigation analysis.</p>
    </div>
  `;

  clearTerminal();
  logTerminal(`[WADL Engine] Sandbox reset. All entities returned to baseline.`, "info");
  logTerminal(`[AP Monitor] Monitoring 802.11 frames on channel 6...`, "info");
}
