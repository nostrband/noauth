import { KeySorter, KeyValueEncoded } from './sorts.js';

declare class Writer {
    #private;
    static defaultOptions: RequiredWriterOptions;
    constructor(opts?: WriterOptions);
    get length(): number;
    read(): Uint8Array;
    write(buf: Uint8Array): void;
    writeUint8(n: number): void;
    writeUint16(n: number, littleEndian?: boolean): void;
    writeUint32(n: number, littleEndian?: boolean): void;
    writeBigUint64(n: bigint, littleEndian?: boolean): void;
    writeInt16(n: number, littleEndian?: boolean): void;
    writeInt32(n: number, littleEndian?: boolean): void;
    writeBigInt64(n: bigint, littleEndian?: boolean): void;
    writeFloat32(n: number, littleEndian?: boolean): void;
    writeFloat64(n: number, littleEndian?: boolean): void;
    clear(): void;
}
type TagNumber = bigint | number | Number;
/**
 * A potentially-tagged value.  If the tag is NaN, it will not be used.
 * Otherwise, it must be an integer that will be written as a CBOR tag
 * before the value is encoded.
 */
type TaggedValue = [tag: TagNumber, value: unknown];
interface ToCBOR {
    /**
     * If an object implements this interface, this method will be used to
     * serialize the object when encoding.  Return undefined if you don't want
     * any further serialization to take place.  Return an array of [tag, value]
     * if you would like default serialization, where if tag is not NaN, a
     * CBOR tag will be written before the value.
     *
     * @param w Writer.
     * @param opts Options.
     */
    toCBOR(w: Writer, opts: RequiredEncodeOptions): TaggedValue | undefined;
}

type SimpleValue = true | false | null | undefined | Simple;
/**
 * A CBOR "Simple" value that is not one of the pre-standardized set.
 */
declare class Simple implements ToCBOR {
    static KnownSimple: Map<number, SimpleValue>;
    value: number;
    constructor(value: number);
    static create(num: number): SimpleValue;
    toCBOR(w: Writer, opts: RequiredEncodeOptions): undefined;
    toString(): string;
    /**
     * Convert this simple value to a useful data type, if possible.
     *
     * @returns The converted value.
     */
    decode(): SimpleValue;
}

/**
 * Options for decoding.
 */
interface DecodeStreamOptions {
    /**
     * Maximum allowed depth to parse into CBOR structures.  This limit is
     * security-relevant for untrusted inputs.  May be set to Infinity for
     * trusted inputs, but be careful!
     * @default 1024
     */
    maxDepth?: number;
    /**
     * If the input is a string, how should it be decoded into a byte stream?
     * Ignored if the input is a Uint8Array.
     * @default null
     */
    encoding?: 'base64' | 'hex' | null;
    /**
     * Reject integers and lengths that could have been encoded in a smaller
     * encoding.
     *
     * @default false
     */
    requirePreferred?: boolean;
}
/**
 * These less-complex types are decoded as tokens at this level.
 */
type DecodeValue = Simple | Symbol | Uint8Array | bigint | boolean | number | string | null | undefined;
interface Sliceable {
    toHere(begin?: number): Uint8Array;
}
/**
 * Information about a decoded CBOR data item.  3-element tuple, containing:
 * - Major type.
 * - Additional Information (int if < 23, else length as 24-27, 31 as stream).
 * - Decoded token value.
 * - Offset into the input where this item started.
 */
type MtAiValue = [
    mt: number,
    ai: number,
    val: DecodeValue,
    offset: number,
    len: bigint | number
];
interface ParentConstructor {
    new (mav: MtAiValue, left: number, parent: Parent | undefined, opts: RequiredDecodeOptions): Parent;
}
interface Decodeable {
    decode(options: RequiredDecodeOptions): unknown;
}
interface Parent {
    parent: Parent | undefined;
    children: Decodeable | unknown[];
    left: number;
    offset: number;
    depth: number;
    get done(): boolean;
    get isStreaming(): boolean;
    push(child: unknown, stream: Sliceable, offset: number): number;
    replaceLast(child: unknown, item: Parent, stream: Sliceable): unknown;
    convert(stream: Sliceable): unknown;
}
/**
 * See String.prototype.normalize.
 */
type StringNormalization = 'NFC' | 'NFD' | 'NFKC' | 'NFKD';
/**
 * Different styles of diagnose output for "spec" sizes.  "Spec" sizes
 * are _i for 0-23 encoded in the AI byte, _0 for one extra byte, _1
 * for two extra bytes, _2 for four extra bytes, _3 for eight extra bytes,
 * and a plain _ for indefinite encoding.
 */
declare enum DiagnosticSizes {
    /** Never use spec sizes, except for as required for indefinite encoding. */
    NEVER = -1,
    /** Only use spec sizes when non-preferred encoding was used. */
    PREFERRED = 0,
    /** Always use spec sizes. */
    ALWAYS = 1
}
type ObjectCreator = (kve: KeyValueEncoded[], opts: RequiredDecodeOptions) => unknown;
/**
 * Decoding options.
 */
interface DecodeOptions extends DecodeStreamOptions {
    /**
     * What type to create when a container is needed? This is used internally
     * by comment and diagnose to add separate functionality.  Internal use only.
     * @default CBORcontainer
     * @private
     */
    ParentType?: ParentConstructor;
    /**
     * Should numbers and strings be created as boxed instances, which retain
     * their original encoding for round-tripping?  If this is true,
     * saveOriginal is also set to true.  Think of this as "saveOriginal +
     * extras".  The thought is that most use cases for saveOriginal will want
     * the original encoding of an object or array, and won't care about the
     * original encoding of strings and numbers.  Turning this on also has the
     * side-effect of making all CBOR maps decode as JS Map objects, rather than
     * plain Objects.
     * @default false
     */
    boxed?: boolean;
    /**
     * Turn on options for draft-ietf-cbor-cde-05.
     */
    cde?: boolean;
    /**
     * In dCBOR, JS numbers between 2^53 and 2^64 get encoded as CBOR integers.
     * When decoding, present them as JS numbers instead of BigInt, losing
     * accuracy.
     */
    convertUnsafeIntsToFloat?: boolean;
    /**
     * Turn on options for draft-mcnally-deterministic-cbor-11.
     */
    dcbor?: boolean;
    /**
     * Should the size of an element always be appended to that element using
     * an underscore when calling diagnose?
     * @default DiagnosticSizes.PREFERRED
     */
    diagnosticSizes?: DiagnosticSizes;
    /**
     * Create an object from an array of key-value pairs.  The default
     * implementation creates a plain JS object if all of the keys are strings,
     * otherwise creates a Map (unless preferMap or boxed is set, in which case
     * a Map is always created).
     */
    createObject?: ObjectCreator;
    /**
     * Always generate Map instances when decoding, instead of trying to
     * generate object instances when all of the keys are strings.  If you
     * have the boxed option on, this option has no effect, and Maps are always
     * produced.
     */
    preferMap?: boolean;
    /**
     * Pretty-print diagnostic format.
     * @default false
     */
    pretty?: boolean;
    /**
     * Reject negative integers in the range [CBOR_NEGATIVE_INT_MAX ...
     * STANDARD_NEGATIVE_INT_MAX - 1].
     * @default false
     */
    rejectLargeNegatives?: boolean;
    /**
     * If there are bigint (tag 2/3) in the incoming data, exit with an error.
     * @default false
     */
    rejectBigInts?: boolean;
    /**
     * If there are duplicate keys in a map, should we throw an exception? Note:
     * this is more compute-intensive than expected at the moment, but that will
     * be fixed eventually.
     * @default false
     */
    rejectDuplicateKeys?: boolean;
    /**
     * Reject any floating point numbers.  This might be used in profiles that
     * are not expecting floats to prevent one from being coerced to an
     * integer-looking number without the receiver knowing.
     * @default false
     */
    rejectFloats?: boolean;
    /**
     * Reject any mt 0/1 numbers.  This might be used in profiles that expect
     * all numbers to be encoded as floating point.
     * @default false
     */
    rejectInts?: boolean;
    /**
     * Reject floating point numbers that should have been encoded in shorter
     * form, including having been encoded as an integer.
     */
    rejectLongFloats?: boolean;
    /**
     * Reject NaNs that are not encoded as 0x7e00.
     * @default false
     */
    rejectLongLoundNaN?: boolean;
    /**
     * If negative zero (-0) is received, throw an error.
     * @default false
     */
    rejectNegativeZero?: boolean;
    /**
     * Reject simple values other than true, false, undefined, and null.
     * @default false
     */
    rejectSimple?: boolean;
    /**
     * Reject any attempt to decode streaming CBOR.
     * @default false
     */
    rejectStreaming?: boolean;
    /**
     * Reject subnormal floating point numbers.
     * @default false
     */
    rejectSubnormals?: boolean;
    /**
     * Reject strings that are not normalized with the given normalization form.
     * Don't use this without Unicode expertise.
     */
    rejectStringsNotNormalizedAs?: StringNormalization | null;
    /**
     * For dCBOR, reject "integers" between 2^53 and 2^64 that were encoded
     * as floats.
     */
    rejectUnsafeFloatInts?: boolean;
    /**
     * Reject the `undefined` simple value.  Usually used with rejectSimple.
     * @default false
     */
    rejectUndefined?: boolean;
    /**
     * Save the original bytes associated with every object as a property of
     * that object.  Use `getEncoded(obj)` to retrieve the associated bytes.
     * If you need the original encoded form of primitive items such as numbers
     * and strings, set `boxed: true` as well.
     */
    saveOriginal?: boolean;
    /**
     * If non-null, keys being decoded MUST be in this order.  Note that this is a
     * superset of rejectDuplicateKeys, and is slightly more efficient.
     * @default null
     */
    sortKeys?: KeySorter | null;
}
type RequiredDecodeOptions = Required<DecodeOptions>;
/**
 * Comment options on top of the decode options.
 */
interface CommentOptions extends DecodeOptions {
    /**
     * For the root object, how many levels of nesting is it already?
     * Happens with tag 24.
     * @default 0
     */
    initialDepth?: number;
    /**
     * If true, don't add the initial 0xHEX line to comment output.
     * @default false
     */
    noPrefixHex?: boolean;
    /**
     * The '--' separating bytes from description must be in at least this
     * column.
     * @default 0
     */
    minCol: number;
}
type RequiredCommentOptions = Required<CommentOptions>;
interface WriterOptions {
    chunkSize?: number;
}
type RequiredWriterOptions = Required<WriterOptions>;
interface EncodeOptions extends WriterOptions {
    /**
     * Encode all integers as floating point numbers of the correct size.
     * @default false
     */
    avoidInts?: boolean;
    /**
     * Turn on options for draft-ietf-cbor-cde-05.
     */
    cde?: boolean;
    /**
     * Should bigints that can fit into normal integers be collapsed into
     * normal integers?
     * @default true
     */
    collapseBigInts?: boolean;
    /**
     * Turn on options for draft-mcnally-deterministic-cbor-11.
     */
    dcbor?: boolean;
    /**
     * When writing floats, always use the 64-bit version.  Often combined with
     * `avoidInts`.
     * @default false
     */
    float64?: boolean;
    /**
     * When writing floats, first flush any subnormal numbers to zero before
     * decising on encoding.
     */
    flushToZero?: boolean;
    /**
     * How to write TypedArrays?
     * Null to use the current platform's endian-ness.
     * True to always use little-endian.
     * False to always use big-endian.
     * @default null
     */
    forceEndian?: boolean | null;
    /**
     * Ignore sizes on boxed numbers; they might be overly-large.
     * @default false
     */
    ignoreOriginalEncoding?: boolean;
    /**
     * Do not encode numbers in the range  [CBOR_NEGATIVE_INT_MAX ...
     * STANDARD_NEGATIVE_INT_MAX - 1] as MT 1.
     * @default false
     */
    largeNegativeAsBigInt?: boolean;
    /**
     * Per dcbor:
     *
     * "MUST check whether floating point values to be encoded have the
     * numerically equal value in DCBOR_INT = [-2^63, 2^64-1].  If that is the
     * case, it MUST be converted to that numerically equal integer value
     * before encoding it.  (Preferred encoding will then ensure the shortest
     * length encoding is used.)  If a floating point value has a non-zero
     * fractional part, or an exponent that takes it out of DCBOR_INT, the
     * original floating point value is used for encoding.  (Specifically,
     * conversion to a CBOR bignum is never considered.)"
     *
     * This should only apply to "integers" that are outside the JS safe range
     * of [-(2^53 - 1), 2^53-1].
     */
    reduceUnsafeNumbers?: boolean;
    /**
     * Do not encode bigints that cannot be reduced to integers.
     * @default false
     */
    rejectBigInts?: boolean;
    /**
     * If true, error instead of encoding an instance of Simple.
     * @default false
     */
    rejectCustomSimples?: boolean;
    /**
     * Check that Maps do not contain keys that encode to the same bytes as
     * one another.  This is possible in a Map with object keys.
     * @default false
     */
    rejectDuplicateKeys?: boolean;
    /**
     * Do not encode floating point numbers that cannot be reduced to integers.
     * @default false
     */
    rejectFloats?: boolean;
    /**
     * If true, error instead of encoding `undefined`.
     * @default false
     */
    rejectUndefined?: boolean;
    /**
     * If true, encode -0 as 0.
     * @default false
     */
    simplifyNegativeZero?: boolean;
    /**
     * How should the key/value pairs be sorted before an object or Map
     * gets created?  If null, no sorting is performed.
     * @default null
     */
    sortKeys?: KeySorter | null;
    /**
     * If specified, normalize strings on encoding.  'NFD' may optimize for CPU,
     * 'NFC' may optimize for size.  Don't use this without Unicode
     * expertise.  In particular, the 'K' forms are really unlikely to be useful.
     * @default undefined
     */
    stringNormalization?: StringNormalization | null;
}
type RequiredEncodeOptions = Required<EncodeOptions>;

export { type CommentOptions as C, type DecodeOptions as D, type EncodeOptions as E, type MtAiValue as M, type ObjectCreator as O, type Parent as P, type RequiredDecodeOptions as R, type Sliceable as S, type TagNumber as T, type WriterOptions as W, type RequiredEncodeOptions as a, type Decodeable as b, type DecodeStreamOptions as c, type DecodeValue as d, type ParentConstructor as e, type RequiredCommentOptions as f, type StringNormalization as g, DiagnosticSizes as h, Simple as i, type TaggedValue as j, type ToCBOR as k, Writer as l, type SimpleValue as m, type RequiredWriterOptions as n };
