// The viewing preferences of this browser: appearance, motion, and sound. They are kept apart from the saved game.
import { button, status } from './dom.ts';

export let storage: Storage | null = null;
try { storage = window.localStorage; } catch { /* Session play remains available. */ }
const THEME_KEY = 'scary-snacks-theme';
const MOTION_KEY = 'scary-snacks-motion';
// The area the room shows when the player chose one.
export const AREA_KEY = 'scary-snacks-area';
export const THEMES = [['system','System'],['light','Light'],['dark','Dark']];
export const MOTIONS = [['system','System'],['reduced','Reduced'],['full','Full']];
export const phone = matchMedia('(max-width: 720px)');
// Up to this width the kitchen uses sheets; wider screens dock it beside the room.
export const drawerLayout = matchMedia('(max-width: 1023px)');
// Short screens put the kitchen in page flow and have no drawer handle.
export const movableDrawer = matchMedia('(max-width: 1023px) and (height > 600px)');
// Reduced motion keeps every outcome and line of text, without the flights, the drawer's movement, the fades, or the bats.
// The Motion choice in Options follows the device (System), or stills or plays the motion whatever the device asks.
const deviceStill = matchMedia('(prefers-reduced-motion: reduce)');
// Dark is the appearance of a browser that has no choice stored. Motion follows the device until the player chooses.
export let theme = 'dark', motion = 'system';
export const still = () => motion === 'reduced' || (motion === 'system' && deviceStill.matches);
let sound = false, audioContext: AudioContext | null = null;

/** A viewing preference, kept apart from the save. Without storage it holds for this visit. */
function storedSetting(key: string, fallback = 'system') {
  try { return storage?.getItem(key) || fallback; } catch { return fallback; }
}
function storeSetting(key: string, value: string, setting: string) {
  try { if(!storage)throw new Error('Browser storage is unavailable.');storage.setItem(key, value); }
  catch { status(`${setting} changed for this session. Browser storage is unavailable.`); }
}
/** The theme-color meta uses the resolved page colour, so the browser chrome follows a chosen theme too. */
function syncThemeColor() {
  const color = getComputedStyle(document.documentElement).getPropertyValue('--page').trim();
  if (!color) return;
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) meta.content = color;
}
export function setTheme(choice: string, persist = false) {
  theme = THEMES.some(([value]) => value === choice) ? choice : 'dark';
  document.documentElement.dataset.theme = theme;
  syncThemeColor();
  if (persist) storeSetting(THEME_KEY, theme, 'Appearance');
}
setTheme(storedSetting(THEME_KEY, 'dark'));
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncThemeColor);
export const motionNote = () => deviceStill.matches ? 'System follows your device, which asks for less motion.' : 'System follows your device’s motion setting.';
// Effects that reduced motion suppressed must not replay when motion returns, so each part of the interface ends its own.
const resumes: (() => void)[] = [];
export const onMotionResume = (listener: () => void) => { resumes.push(listener); };
let motionReduced = still();
function syncMotion() {
  const note = document.querySelector('#motion-note');
  if(note)note.textContent=motionNote();
  if(motionReduced&&!still())for(const listener of resumes)listener();
  motionReduced=still();
  // CSS stops its own effects. Finish script animations so their cleanup and delivery notices still run.
  if(still())for(const animation of document.getAnimations()) {
    if(Number.isFinite(animation.effect?.getComputedTiming().endTime))animation.finish();
  }
}
export function setMotion(choice: string, persist = false) {
  motion = MOTIONS.some(([value]) => value === choice) ? choice : 'system';
  document.documentElement.dataset.motion = motion;
  syncMotion();
  if (persist) storeSetting(MOTION_KEY, motion, 'Motion');
}
setMotion(storedSetting(MOTION_KEY));
deviceStill.addEventListener('change',syncMotion);

export function playTone(kind: string) {
  if (!sound) return;
  const unavailable = () => {
    sound = false;
    const toggle = document.querySelector('[data-sound-toggle]');
    if (toggle) toggle.textContent = 'Turn sound on';
    status('Sound is unavailable in this browser.');
  };
  try {
    const context = audioContext ||= new AudioContext();
    context.resume().catch(unavailable);
    const now = context.currentTime;
    const frequencies = kind === 'deliverQuest' ? [392, 587.33] : kind === 'task' ? [329.63, 493.88] : [293.66];
    frequencies.forEach((frequency, index) => {
      const tone = context.createOscillator(); const gain = context.createGain();
      tone.type = 'sine'; tone.frequency.value = frequency;
      gain.gain.setValueAtTime(0, now + index * .07);
      gain.gain.linearRampToValueAtTime(.045, now + index * .07 + .012);
      gain.gain.exponentialRampToValueAtTime(.001, now + index * .07 + .16);
      tone.connect(gain); gain.connect(context.destination);
      tone.start(now + index * .07); tone.stop(now + index * .07 + .18);
      tone.onended = () => { tone.disconnect(); gain.disconnect(); };
    });
  } catch { unavailable(); }
}
/** Kitchen sounds: the toggle changes its own words, so focus stays on it. */
export function soundToggle() {
  const toggle=button(sound?'Turn sound off':'Turn sound on','secondary-button',()=>{sound=!sound;playTone('deliverQuest');toggle.textContent=sound?'Turn sound off':'Turn sound on';});
  toggle.dataset.soundToggle='';
  return toggle;
}
