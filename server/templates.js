// Each site served from here uses a template: its pages, its default content and
// the rules for what may be saved. This project has one: the Dnamo Football Club site.
import { CLUB } from './club.js';

export const templateFor = () => CLUB;

export function clean(tpl, key, value) {
  if (!tpl.CLEAN[key]) throw new Error('Unknown setting.');
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid value.');
  return tpl.CLEAN[key](value);
}
