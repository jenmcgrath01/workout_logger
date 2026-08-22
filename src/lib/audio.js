let ctx = null

function getCtx() {
  if (ctx) return ctx
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return null
    ctx = new Ctx()
  } catch {
    return null
  }
  return ctx
}

// iOS only allows audio that starts from a user gesture, and it suspends the
// context aggressively. Call this from a tap handler before scheduling.
export function unlockAudio() {
  const c = getCtx()
  if (c && c.state === 'suspended') c.resume()
  return c
}

function scheduleTone(c, atTime, { freq = 880, duration = 0.15, gain = 0.25 } = {}) {
  const osc = c.createOscillator()
  const amp = c.createGain()
  osc.connect(amp)
  amp.connect(c.destination)
  osc.frequency.value = freq

  // Short fades keep it from clicking at the edges.
  amp.gain.setValueAtTime(0, atTime)
  amp.gain.linearRampToValueAtTime(gain, atTime + 0.01)
  amp.gain.setValueAtTime(gain, atTime + duration - 0.02)
  amp.gain.linearRampToValueAtTime(0, atTime + duration)

  osc.start(atTime)
  osc.stop(atTime + duration + 0.02)
  return osc
}

export function playBeep(opts) {
  const c = unlockAudio()
  if (!c) return
  scheduleTone(c, c.currentTime, opts)
}

/**
 * Schedules every beep for a timed hold up front, at precise audio-clock times.
 *
 * Pre-scheduling matters: phone browsers throttle setInterval in a backgrounded
 * or screen-locked tab, so beeps driven by a JS tick would drift or stop.
 * The audio clock keeps running, so these still land on time.
 *
 * Returns a cancel() that silences anything not yet played.
 */
export function scheduleHoldBeeps({ leadInSeconds, holdSeconds, intervalSeconds = 10 }) {
  const c = unlockAudio()
  if (!c) return () => {}

  const t0 = c.currentTime
  const scheduled = []

  // Lead-in: one tick per second, then a higher "go" on zero.
  for (let i = leadInSeconds; i > 0; i--) {
    scheduled.push(scheduleTone(c, t0 + (leadInSeconds - i), { freq: 660, duration: 0.12, gain: 0.2 }))
  }
  scheduled.push(scheduleTone(c, t0 + leadInSeconds, { freq: 880, duration: 0.25 }))

  // Progress ticks at each interval of time *remaining*, so the last one you
  // hear is always "intervalSeconds to go".
  for (let remaining = intervalSeconds; remaining < holdSeconds; remaining += intervalSeconds) {
    const elapsed = holdSeconds - remaining
    if (elapsed <= 0) continue
    scheduled.push(scheduleTone(c, t0 + leadInSeconds + elapsed, { freq: 880, duration: 0.12, gain: 0.2 }))
  }

  // Finish: three rising beeps.
  const end = t0 + leadInSeconds + holdSeconds
  for (let i = 0; i < 3; i++) {
    scheduled.push(scheduleTone(c, end + i * 0.28, { freq: 1046, duration: 0.22, gain: 0.3 }))
  }

  return function cancel() {
    for (const osc of scheduled) {
      try {
        osc.stop()
      } catch {
        // already stopped
      }
    }
  }
}
