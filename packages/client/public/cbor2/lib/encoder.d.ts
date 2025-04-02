import { a as RequiredEncodeOptions, E as EncodeOptions, l as Writer, j as TaggedValue, T as TagNumber } from './options-BZO68bQ0.js';
import './sorts.js';

declare const ENCODED: symbol;
declare const defaultEncodeOptions: RequiredEncodeOptions;
/**
 * Encode with CDE ({@link
 * https://www.ietf.org/archive/id/draft-ietf-cbor-cde-05.html CBOR Common
 * Deterministic Encoding Profile}).  Eable this set of options by setting
 * `cde` to true.
 *
 * Since cbor2 always uses preferred encoding, this option only sets the
 * sort algorithm for map/object keys, and ensures that any original
 * encoding information (from decoding with saveOriginal) is ignored.
 */
declare const cdeEncodeOptions: EncodeOptions;
/**
 * Encode with CDE and dCBOR ({@link
 * https://www.ietf.org/archive/id/draft-mcnally-deterministic-cbor-11.html
 * dCBOR: A Deterministic CBOR Application Profile}).  Enable this set of
 * options by setting `dcbor` to true.
 *
 * Several of these options can cause errors to be thrown for inputs that
 * would have otherwise generated valid CBOR (e.g. `undefined`).
 */
declare const dcborEncodeOptions: EncodeOptions;
/**
 * Any class.  Ish.
 */
type AbstractClassType<T extends abstract new (...args: any) => any> = abstract new (...args: any) => InstanceType<T>;
type TypeEncoder<T> = (obj: T, w: Writer, opts: RequiredEncodeOptions) => TaggedValue | undefined;
interface ToJSON {
    /**
     * Used by the JSON.stringify method to enable the transformation of an
     * object's data for JavaScript Object Notation (JSON) serialization.
     */
    toJSON(key?: unknown): string;
}
/**
 * Write a floating point number to the stream.  Prefers the smallest size
 * that does not lose precision for the given number.  Writes the size with
 * majpr type SIMPLE_FLOAT before big-endian bytes.
 *
 * @param val Floating point number.
 * @param w Writer.
 * @param opts Encoding options.
 * @throws On unwanted float.
 */
declare function writeFloat(val: number, w: Writer, opts: RequiredEncodeOptions): void;
/**
 * Write a number that is sure to be an integer to the stream.  If no mt is
 * given writes major type POS_INT or NEG_INT as appropriate.  Otherwise uses
 * the given mt a the major type, and the value must be non-negative.  Numbers
 * with fractions are silently truncated to integer.  Numbers outside the safe
 * range silently lose precision.  -0 is silently changed to 0.
 *
 * @param val Number that is an integer that satisfies `MIN_SAFE_INTEGER <=
 *   val <= MAX_SAFE_INTEGER`.
 * @param w Writer.
 * @param mt Major type, if desired.  Obj will be real integer > 0.
 * @throws On invalid combinations.
 */
declare function writeInt(val: number, w: Writer, mt?: number): void;
/**
 * Write a tag number to the output stream.  MUST be followed by writing
 * the tag contents.
 *
 * @param tag Tag number.
 * @param w Stream to write to.
 */
declare function writeTag(tag: TagNumber, w: Writer, opts: RequiredEncodeOptions): void;
/**
 * Intended for internal use.
 *
 * @param val Bigint to write.
 * @param w Writer.
 * @param opts Options.
 * @throws On unwanted bigint.
 */
declare function writeBigInt(val: bigint, w: Writer, opts: RequiredEncodeOptions): void;
/**
 * Write a number, be it integer or floating point, to the stream, along with
 * the appropriate major type.
 *
 * @param val Number.
 * @param w Writer.
 * @param opts Encoding options.
 */
declare function writeNumber(val: number, w: Writer, opts: RequiredEncodeOptions): void;
/**
 * Convert the string to UTF8.  Write the length of the UTF8 version to the
 * stream with major type UTF8_STRING, then the UTF8 bytes.
 *
 * @param val String.
 * @param w Writer.
 */
declare function writeString(val: string, w: Writer, opts: RequiredEncodeOptions): void;
/**
 * Write the length of an array with ARRAY major type, then each of the items
 * in the array.  Writes undefined for holes in the array.
 *
 * @param obj Array.
 * @param w Writer.
 * @param opts Options.
 */
declare function writeArray(obj: unknown, w: Writer, opts: RequiredEncodeOptions): undefined;
/**
 * Write the length of a buffer with BYTE_STRING major type, then the contents
 * of the buffer.
 *
 * @param obj Buffer.
 * @param w Writer.
 */
declare function writeUint8Array(obj: unknown, w: Writer): undefined;
/**
 * Add a known converter for the given type to CBOR.
 *
 * @param typ Type constructor, e.g. "Array".
 * @param encoder Converter function for that type.
 * @returns Previous converter for that type, or unknown.
 */
declare function registerEncoder<T extends AbstractClassType<T>>(typ: T, encoder: TypeEncoder<InstanceType<T>>): TypeEncoder<T> | undefined;
/**
 * Remove the given type from being converted to CBOR.
 *
 * @param typ Type constructor, e.e.g "Array".
 * @returns Previous converter for that type, or unknown.
 */
declare function clearEncoder<T extends AbstractClassType<T>>(typ: T): TypeEncoder<T> | undefined;
declare function writeLength(obj: object, len: number, mt: number, w: Writer, opts: RequiredEncodeOptions): void;
/**
 * Write a single value of unknown type to the given writer.
 *
 * @param val The value.
 * @param w The writer.
 * @param opts Encoding options.
 * @throws TypeError for Symbols or unknown JS typeof results.
 */
declare function writeUnknown(val: unknown, w: Writer, opts: RequiredEncodeOptions): void;
/**
 * Convert the given input to a CBOR byte string.
 *
 * @param val Any JS value that is CBOR-convertible.
 * @param options Tweak the conversion process.
 * @returns Bytes in a Uint8Array buffer.
 */
declare function encode(val: unknown, options?: EncodeOptions): Uint8Array;
/**
 * Return a boxed number encoded in the desired (often non-optimal) format.
 * This might be used for APIs that have strict encoding requirements where
 * the normal JS number does not always create the correct encoding.
 * NOTES: -0 is always encoded as -0, without simplification, as long as the
 * selected encoding is floating point.  Otherwise, -0 causes an error.
 * You MUST NOT use the `ignoreOriginalEncoding` option when encoding these
 * numbers, or the encoding that is stored along with the boxed number will
 * be ignored.  The `cde` and `dcbor` options turn on `ignoreOriginalEncoding`
 * by default, so it must be exlicitly disabled.
 *
 * @example
 * const num = encodedNumber(2, 'i32');
 * // [Number: 2]
 * const enc = encode(num, {cde: true, ignoreOriginalEncoding: false});
 * // Uint8Array(3) [ 25, 0, 2 ]
 *
 * @param value Number to be encoded later
 * @param encoding Desired encoding.  Default: 'f', which uses the preferred
 *   float encoding, even for integers.
 * @returns Boxed number or bigint object with hidden property set containing
 *   the desired encoding.
 */
declare function encodedNumber(value: bigint | number, encoding: 'bigint'): BigInt;
declare function encodedNumber(value: bigint | number, encoding: 'i' | 'i64', majorType?: number): Number | BigInt;
declare function encodedNumber(value: bigint | number, encoding: 'i0' | 'i8' | 'i16' | 'i32', majorType?: number): Number;
declare function encodedNumber(value: bigint | number, encoding?: 'f' | 'f16' | 'f32' | 'f64'): Number;

export { type AbstractClassType, ENCODED, type ToJSON, type TypeEncoder, cdeEncodeOptions, clearEncoder, dcborEncodeOptions, defaultEncodeOptions, encode, encodedNumber, registerEncoder, writeArray, writeBigInt, writeFloat, writeInt, writeLength, writeNumber, writeString, writeTag, writeUint8Array, writeUnknown };
