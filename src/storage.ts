/** Local-only persistence. */
const FORMAT = 'scary-snacks';
/** Only the current save format is supported. */
const VERSION = 9;
export const SAVE_KEY = `scary-snacks-save-v${VERSION}`;
export const MAX_SAVE_BYTES = 2 * 1024 * 1024;

export type SaveStatus = 'loaded' | 'empty' | 'invalid' | 'unsupported' | 'unavailable';
export type SaveStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
/** Only a result of exactly true admits a state. */
export type Validator = (state: unknown) => unknown;
export type LoadResult<State> = { state: State | null; status: SaveStatus; error: string | null };
export type WriteResult = { ok: boolean; error: string | null };

class SaveError extends Error {
  status: SaveStatus;
  constructor(message: string, status: SaveStatus = 'invalid') {
    super(message);
    this.name = 'SaveError';
    this.status = status;
  }
}

function message(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function available(storage: SaveStorage | null): SaveStorage {
  if (!storage) throw new Error('Storage is unavailable.');
  return storage;
}

function validateState(state: unknown, validate: Validator | undefined) {
  if (typeof validate !== 'function') {
    throw new SaveError('A save validator is required.');
  }
  let valid;
  try {
    valid = validate(state);
  } catch {
    throw new SaveError('The saved game could not be checked.');
  }
  if (valid !== true) throw new SaveError('The saved game has damaged or unknown game data.');
}

function parseSave<State>(text: unknown, validate: Validator | undefined): State {
  if (typeof text !== 'string') throw new SaveError('The save must be JSON text.');
  // Check string length first to avoid allocating a large UTF-8 buffer.
  if (text.length > MAX_SAVE_BYTES || new TextEncoder().encode(text).byteLength > MAX_SAVE_BYTES) {
    throw new SaveError('The saved game is larger than the 2 MiB limit.');
  }
  let envelope;
  try {
    envelope = JSON.parse(text);
  } catch {
    throw new SaveError('The saved game is damaged and cannot be read.');
  }
  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) {
    throw new SaveError('This is not a Scary Snacks saved game.');
  }
  if (envelope.format !== FORMAT || envelope.version !== VERSION) {
    throw new SaveError('The saved game comes from another game or a version this one cannot open.', 'unsupported');
  }
  if (!Object.hasOwn(envelope, 'state')) {
    throw new SaveError('The saved game has no game data in it.');
  }
  validateState(envelope.state, validate);
  return envelope.state as State;
}

/** Returns state only after the complete envelope and game state pass validation. */
export function loadSave<State>(storage: SaveStorage | null, validate: Validator | undefined): LoadResult<State> {
  let text = null;
  try {
    text = available(storage).getItem(SAVE_KEY);
  } catch (error) {
    return { state: null, status: 'unavailable', error: `Cannot read browser storage: ${message(error, 'Storage is unavailable.')}` };
  }
  if (text === null) return { state: null, status: 'empty', error: null };
  try {
    const state = parseSave<State>(text, validate);
    return { state, status: 'loaded', error: null };
  } catch (error) {
    return { state: null, status: error instanceof SaveError ? error.status : 'invalid', error: message(error, 'Cannot read the saved game.') };
  }
}

/** Export the same versioned envelope used in storage. Never changes state. */
export function exportSave(state: unknown, validate: Validator | undefined) {
  validateState(state, validate);
  let text;
  try {
    text = JSON.stringify({ format: FORMAT, version: VERSION, state });
  } catch {
    throw new SaveError('The game data cannot be saved as JSON.');
  }
  // Check the serialized representation too: JSON can drop or change values.
  parseSave(text, validate);
  return text;
}

/** Parse before replacing live state. The caller decides when to adopt this state. */
export function importSave<State>(text: unknown, validate: Validator | undefined): State {
  return parseSave<State>(text, validate);
}

/** One atomic setItem. Never remove an existing save to make room for a write. */
export function saveGame(storage: SaveStorage | null, state: unknown, validate: Validator | undefined): WriteResult {
  let text;
  try {
    text = exportSave(state, validate);
  } catch (error) {
    return { ok: false, error: message(error, 'Cannot serialize the game data.') };
  }
  if (!storage) return { ok: false, error: 'Browser storage is unavailable.' };
  const existing = loadSave(storage, validate);
  if (existing.status !== 'empty' && existing.status !== 'loaded') {
    return { ok: false, error: `The existing save was preserved. ${existing.error}` };
  }
  try {
    available(storage).setItem(SAVE_KEY, text);
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error: `Cannot write the save: ${message(error, 'Storage is unavailable.')}` };
  }
}

/** Explicit reset: replace the current save in one write, including an unreadable current save. */
export function resetSave(storage: SaveStorage | null, state: unknown, validate: Validator | undefined): WriteResult {
  let text;
  try { text = exportSave(state, validate); }
  catch (error) { return { ok: false, error: message(error, 'Cannot serialize the new game.') }; }
  try {
    available(storage).setItem(SAVE_KEY, text);
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error: `Cannot reset the save: ${message(error, 'Storage is unavailable.')}` };
  }
}
