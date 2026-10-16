/** Local-only persistence. */
const FORMAT = 'scary-snacks';
/** The envelope version that this game writes. Envelopes 1 through VERSION - 1 load through migrations. */
const VERSION = 5;
/** Each envelope version has its own key, so a conversion never changes the bytes of an older save. */
const saveKey = (version: number) => `scary-snacks-save-v${version}`;
export const SAVE_KEY = saveKey(VERSION);
export const LEVEL_REWARD_SAVE_KEY = saveKey(4);
export const GENERATOR_SAVE_KEY = saveKey(3);
export const PREVIOUS_SAVE_KEY = saveKey(2);
export const LEGACY_SAVE_KEY = saveKey(1);
export const MAX_SAVE_BYTES = 2 * 1024 * 1024;

export type SaveStatus = 'loaded' | 'empty' | 'invalid' | 'unsupported' | 'unavailable';
export type SaveStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
/** Only a result of exactly true admits a state. */
export type Validator = (state: unknown) => unknown;
export type Migration = { validate: Validator; migrate: (state: unknown) => unknown };
/** Migration n converts the state of envelope version n into the state of envelope version n + 1. */
export type Migrations = Partial<Record<number, Migration>>;
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

function parseSave<State>(text: unknown, validate: Validator | undefined, migrations?: Migrations, expectedVersion?: number): State {
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
  if (envelope.format !== FORMAT || !Number.isInteger(envelope.version) || envelope.version < 1 || envelope.version > VERSION
    || (expectedVersion !== undefined && envelope.version !== expectedVersion)) {
    throw new SaveError('The saved game comes from another game or a version this one cannot open.', 'unsupported');
  }
  if (!Object.hasOwn(envelope, 'state')) {
    throw new SaveError('The saved game has no game data in it.');
  }
  let state: unknown = envelope.state;
  for (let version: number = envelope.version; version < VERSION; version++) {
    const migration = migrations?.[version];
    if (!migration) throw new SaveError('The saved game comes from a version this one cannot open.', 'unsupported');
    validateState(state, migration.validate);
    try { state = migration.migrate(state); }
    catch { throw new SaveError('The older saved game could not be converted.'); }
    validateState(state, version + 1 === VERSION ? validate : migrations?.[version + 1]?.validate);
  }
  validateState(state, validate);
  return state as State;
}

/** Returns state only after the complete envelope and game state pass validation. */
export function loadSave<State>(storage: SaveStorage | null, validate: Validator | undefined, migrations?: Migrations): LoadResult<State> {
  let text = null;
  let version = VERSION;
  try {
    text = available(storage).getItem(SAVE_KEY);
    // Without the current save, the newest older save that exists loads.
    if (migrations) for (let older = VERSION - 1; text === null && older >= 1; older--) {
      text = available(storage).getItem(saveKey(older));
      version = older;
    }
  } catch (error) {
    return { state: null, status: 'unavailable', error: `Cannot read browser storage: ${message(error, 'Storage is unavailable.')}` };
  }
  if (text === null) return { state: null, status: 'empty', error: null };
  try {
    // Each storage key admits only its own envelope version.
    const state = parseSave<State>(text, validate, migrations, version);
    if (version < VERSION) {
      const converted = exportSave(state, validate);
      try { available(storage).setItem(SAVE_KEY, converted); }
      catch (error) {
        return { state: null, status: 'unavailable', error: `The older save was preserved. Cannot save its conversion: ${message(error, 'Storage is unavailable.')}` };
      }
    }
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
export function importSave<State>(text: unknown, validate: Validator | undefined, migrations?: Migrations): State {
  return parseSave<State>(text, validate, migrations);
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
