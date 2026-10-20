// Page helpers that every part of the interface shares: element builders, the status line, and the number and list formats.
export const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
export const element = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string) => {
  const value = document.createElement(tag);
  if (className) value.className = className;
  if (text !== undefined) value.textContent = text;
  return value;
};
export const button = (text: string, className: string, action: () => unknown) => {
  const value = element('button', className, text);
  value.type = 'button'; value.addEventListener('click', () => action()); return value;
};
export const svg = <K extends keyof SVGElementTagNameMap>(tag: K) => document.createElementNS('http://www.w3.org/2000/svg', tag);
export const reason = (error: unknown) => error instanceof Error ? error.message : String(error);
/** Mara's line under the board, which screen readers announce. */
export function status(text: string) { $('#status').textContent = text; }
/** Board cells pulse after a render; the next render removes the pulse. */
export function pulse(cells: number[]) { for (const at of cells) $(`[data-cell="${at}"]`).classList.add('hint'); }
// Numbers follow the page language, like the words around them. Compact totals truncate so they never overstate the purse.
const locale = document.documentElement.lang;
const plural = new Intl.PluralRules(locale);
export const count = new Intl.NumberFormat(locale);
export const compact = new Intl.NumberFormat(locale, { notation:'compact', maximumFractionDigits:1, roundingMode:'trunc' });
export const names = new Intl.ListFormat(locale, { type:'conjunction' });
export const either = new Intl.ListFormat(locale, { type:'disjunction' });
export const coinWord = (value: number) => plural.select(value) === 'one' ? 'coin' : 'coins';
export const coinText = (value: number) => `${count.format(value)} ${coinWord(value)}`;
