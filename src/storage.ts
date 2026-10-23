/** Local-only persistence. */
const FORMAT = 'scary-snacks';
/** Only the current save format is supported. */
const VERSION = 18;
export const SAVE_KEY = `scary-snacks-save-v${VERSION}`;
export const MAX_SAVE_BYTES = 2 * 1024 * 1024;

type SaveStatus = 'loaded' | 'empty' | 'invalid' | 'unsupported' | 'unavailable';
type SaveStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
/** Only a result of exactly true admits a state. */
type Validator = (state: unknown) => unknown;
/** Text is the stored save as read, so a caller can tell a later change by comparing text alone. */
export type LoadResult<State> = { state: State | null; status: SaveStatus; error: string | null; text: string | null };
/** Text is the save that the write stored. */
export type WriteResult = { ok: boolean; error: string | null; text: string | null };

class SaveError extends Error {
  status: SaveStatus;
  constructor(message: string, status: SaveStatus = 'invalid') {
    super(message);
    this.name = 'SaveError';
    this.status = status;
  }
}

/**
 * The stored save that each validator last accepted on a load or a write. The same bytes pass the same validator again, so a write
 * checks the current save only when another writer changed it.
 */
const accepted = new WeakMap<Validator, string>();

function message(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function available(storage: SaveStorage | null): SaveStorage {
  if (!storage) throw new Error('Storage is unavailable.');
  return storage;
}

function validateState(state: unknown, validate: Validator | undefined): asserts validate is Validator {
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
    throw new SaveError(`The saved game is larger than the ${MAX_SAVE_BYTES / 2 ** 20} MiB limit.`);
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
  const state = envelope.state;
  validateState(state, validate);
  return state as State;
}

/** The stored save text, unparsed. Null when there is none or when storage cannot be read. */
export function savedText(storage: SaveStorage | null): string | null {
  try {
    return available(storage).getItem(SAVE_KEY);
  } catch {
    return null;
  }
}

/** Returns state only after the complete envelope and game state pass validation. */
export function loadSave<State>(storage: SaveStorage | null, validate: Validator | undefined): LoadResult<State> {
  let text = null;
  try {
    text = available(storage).getItem(SAVE_KEY);
  } catch (error) {
    return { state: null, status: 'unavailable', error: `Cannot read browser storage: ${message(error, 'Storage is unavailable.')}`, text: null };
  }
  if (text === null) return { state: null, status: 'empty', error: null, text: null };
  try {
    const state = parseSave<State>(text, validate);
    accepted.set(validate!, text);
    return { state, status: 'loaded', error: null, text };
  } catch (error) {
    return { state: null, status: error instanceof SaveError ? error.status : 'invalid', error: message(error, 'Cannot read the saved game.'), text };
  }
}

/**
 * Export the same versioned envelope used in storage. Never changes state. The check runs on the serialized envelope, because
 * storage and files keep that form, and JSON can drop or change values.
 */
export function exportSave(state: unknown, validate: Validator | undefined) {
  let text;
  try {
    text = JSON.stringify({ format: FORMAT, version: VERSION, state });
  } catch {
    throw new SaveError('The game data cannot be saved as JSON.');
  }
  parseSave(text, validate);
  return text;
}

/** Parse before replacing live state. The caller decides when to adopt this state. */
export function importSave<State>(text: unknown, validate: Validator | undefined): State {
  return parseSave<State>(text, validate);
}

/** One atomic setItem. Never remove an existing save to make room for a write, and never replace a save that cannot be read. */
export function saveGame(storage: SaveStorage | null, state: unknown, validate: Validator | undefined): WriteResult {
  let text;
  try {
    text = exportSave(state, validate);
  } catch (error) {
    return { ok: false, error: message(error, 'Cannot serialize the game data.'), text: null };
  }
  if (!storage) return { ok: false, error: 'Browser storage is unavailable.', text: null };
  const check = validate as Validator;
  if (savedText(storage) !== accepted.get(check)) {
    const existing = loadSave(storage, check);
    if (existing.status !== 'empty' && existing.status !== 'loaded') {
      return { ok: false, error: `The existing save was preserved. ${existing.error}`, text: null };
    }
  }
  try {
    storage.setItem(SAVE_KEY, text);
  } catch (error) {
    return { ok: false, error: `Cannot write the save: ${message(error, 'Storage is unavailable.')}`, text: null };
  }
  accepted.set(check, text);
  return { ok: true, error: null, text };
}

/** Explicit replacement, a new game or a confirmed import: replace the current save in one write, including an unreadable current save. */
export function resetSave(storage: SaveStorage | null, state: unknown, validate: Validator | undefined): WriteResult {
  let text;
  try { text = exportSave(state, validate); }
  catch (error) { return { ok: false, error: message(error, 'Cannot serialize the new game.'), text: null }; }
  try {
    available(storage).setItem(SAVE_KEY, text);
  } catch (error) {
    return { ok: false, error: `Cannot reset the save: ${message(error, 'Storage is unavailable.')}`, text: null };
  }
  accepted.set(validate as Validator, text);
  return { ok: true, error: null, text };
}
