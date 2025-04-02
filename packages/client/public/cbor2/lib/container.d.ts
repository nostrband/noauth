import { R as RequiredDecodeOptions, D as DecodeOptions, P as Parent, M as MtAiValue, a as RequiredEncodeOptions } from './options-BZO68bQ0.js';
import { DecodeStream } from './decodeStream.js';
import { Tag } from './tag.js';
import './sorts.js';

/**
 * A CBOR data item that can contain other items.  One of:
 *
 * - Array (streaming or concrete).
 * - Map (streaming or concrete).
 * - Tag (always one item).
 * - Streaming byte arrays or UTF8 arrays.
 *
 * This is used in various decoding applications to keep track of state.
 */
declare class CBORcontainer {
    #private;
    static defaultDecodeOptions: RequiredDecodeOptions;
    /**
     * Throw errors when decoding for bytes that were not encoded with {@link
     * https://www.ietf.org/archive/id/draft-ietf-cbor-cde-05.html CBOR Common
     * Deterministic Encoding Profile}.
     *
     * CDE does not mandate this checking, so it is up to the application
     * whether it wants to ensure that inputs were not encoded incompetetently
     * or maliciously.  To turn all of these on at once, set the cbor option to
     * true.
     */
    static cdeDecodeOptions: DecodeOptions;
    /**
     * Throw errors when decoding for bytes that were not encoded with {@link
     * https://www.ietf.org/archive/id/draft-mcnally-deterministic-cbor-11.html
     * dCBOR: A Deterministic CBOR Application Profile}.
     *
     * The dCBOR spec mandates that these errors be thrown when decoding dCBOR.
     * Turn this on by setting the `dcbor` option to true, which also enables
     * `cde` mode.
     */
    static dcborDecodeOptions: DecodeOptions;
    parent: Parent | undefined;
    mt: number;
    ai: number;
    left: number;
    offset: number;
    count: number;
    children: Tag | unknown[];
    depth: number;
    constructor(mav: MtAiValue, left: number, parent: Parent | undefined, opts: RequiredDecodeOptions);
    get isStreaming(): boolean;
    get done(): boolean;
    /**
     * Factory method that returns the given ParentType if the mt/ai dictate
     * that is necessary, otherwise returns the given value.
     *
     * @param mav Major Type, Additional Information, and Associated value from
     *   token.
     * @param parent If this item is inside another item, the direct parent.
     * @param opts Options controlling creation.
     * @param stream The stream being decoded from.
     * @returns ParentType instance or value.
     * @throws Invalid major type, which should only occur from tests.
     */
    static create(mav: MtAiValue, parent: Parent | undefined, opts: RequiredDecodeOptions, stream: DecodeStream): unknown;
    static decodeToEncodeOpts(decode: RequiredDecodeOptions): RequiredEncodeOptions;
    /**
     * Add the given child to the list of children, and update how many are
     * still needed.
     *
     * @param child Any child item.
     * @param stream Stream being read from.
     * @param offset Offset of start of child in stream.
     * @returns The number of items still needed.
     */
    push(child: unknown, stream: DecodeStream, offset: number): number;
    /**
     * Replace the last child with this one.  Usually after having called
     * convert on the most recent child.
     *
     * @param child New child value.
     * @param item The key or value container.  Used to check for dups.
     * @param stream The stream being read from.
     * @returns Previous child value.
     * @throws Duplicate key.
     */
    replaceLast(child: unknown, item: Parent, stream: DecodeStream): unknown;
    /**
     * Converts the childen to the most appropriate form known.
     *
     * @param stream Stream that we are reading from.
     * @returns Anything BUT a CBORcontainer.
     * @throws Invalid major type.  Only possible in testing.
     */
    convert(stream: DecodeStream): unknown;
}

export { CBORcontainer };
