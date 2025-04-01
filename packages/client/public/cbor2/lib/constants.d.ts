/**
 * Major Types.
 *
 * @enum {number}
 */
declare const MT: {
    POS_INT: number;
    NEG_INT: number;
    BYTE_STRING: number;
    UTF8_STRING: number;
    ARRAY: number;
    MAP: number;
    TAG: number;
    SIMPLE_FLOAT: number;
};
/**
 * Known tag numbers.
 * See https://www.iana.org/assignments/cbor-tags/cbor-tags.xhtml
 * for more information.
 *
 * @enum {number}
 */
declare const TAG: {
    DATE_STRING: number;
    DATE_EPOCH: number;
    POS_BIGINT: number;
    NEG_BIGINT: number;
    DECIMAL_FRAC: number;
    BIGFLOAT: number;
    BASE64URL_EXPECTED: number;
    BASE64_EXPECTED: number;
    BASE16_EXPECTED: number;
    CBOR: number;
    URI: number;
    BASE64URL: number;
    BASE64: number;
    MIME: number;
    SET: number;
    JSON: number;
    REGEXP: number;
    SELF_DESCRIBED: number;
    INVALID_16: number;
    INVALID_32: number;
    INVALID_64: bigint;
};
/**
 * Additional information markers for how many extra bytes to read.
 *
 * @enum {number}
 */
declare const NUMBYTES: {
    ZERO: number;
    ONE: number;
    TWO: number;
    FOUR: number;
    EIGHT: number;
    INDEFINITE: number;
};
/**
 * Defined Simple numbers.
 *
 * @enum {number}
 */
declare const SIMPLE: {
    FALSE: number;
    TRUE: number;
    NULL: number;
    UNDEFINED: number;
};
/**
 * Symbols.  Made globally findable for testing.  Note that this is a class
 * so that TypeScript can see each of these as a "unique symbol", which can
 * then have `typeof` applied to it.
 */
declare class SYMS {
    /**
     * A 0xFF byte as been found in the stream.  Used as a sentinal.
     */
    static readonly BREAK: unique symbol;
    /**
     * Original CBOR encoding for round-tripping and crypto.
     */
    static readonly ENCODED: unique symbol;
    /**
     * Pre-encoded version of length for arrays and maps.  Must include the
     * major type.
     */
    static readonly LENGTH: unique symbol;
}
/**
 * The range [-2^63, 2^64-1].
 */
declare const DCBOR_INT: {
    MIN: bigint;
    MAX: bigint;
};

export { DCBOR_INT, MT, NUMBYTES, SIMPLE, SYMS, TAG };
