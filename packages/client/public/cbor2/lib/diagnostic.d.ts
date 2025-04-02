import { D as DecodeOptions } from './options-BZO68bQ0.js';
import './sorts.js';

/**
 * Diagnostic notation from CBOR-encoded data.
 *
 * @module
 * @example
 *
 * ```js
 * import {diagnose} from 'cbor2/diagnostic';
 * console.log(diagnose('7fff')); // ""_
 * ```
 */

/**
 * Decode CBOR bytes a diagnostic string.
 *
 * @param src CBOR bytes to decode.
 * @param options Options for decoding.
 * @returns JS value decoded from cbor.
 * @throws {Error} No value found, decoding errors.
 */
declare function diagnose(src: Uint8Array | string, options?: DecodeOptions): string;

export { diagnose };
