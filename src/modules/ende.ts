/*
ende stands for encryption decryption
*/
import { secp256k1 as secp } from '@noble/curves/secp256k1'
//import * as secp from "./vendor/secp256k1.js";

export async function encrypt(
    publicKey: string,
    message: string,
    privateKey: string,
): Promise<string> {
    const key = secp.getSharedSecret(privateKey, "02" + publicKey);
    const normalizedKey = getNormalizedX(key);
    const encoder = new TextEncoder();
    const iv = Uint8Array.from(randomBytes(16));
    const plaintext = encoder.encode(message);
    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        normalizedKey,
        { name: "AES-CBC" },
        false,
        ["encrypt"],
    );
    const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-CBC", iv },
        cryptoKey,
        plaintext,
    );

    const ctb64 = toBase64(new Uint8Array(ciphertext));
    const ivb64 = toBase64(new Uint8Array(iv.buffer));
    return `${ctb64}?iv=${ivb64}`;
}

export async function decrypt(
    privateKey: string,
    publicKey: string,
    data: string,
): Promise<string | Error> {
    const key = secp.getSharedSecret(privateKey, "02" + publicKey); // this line is very slow
    return decrypt_with_shared_secret(data, key);
}

export async function decrypt_with_shared_secret(
    data: string,
    sharedSecret: Uint8Array,
): Promise<string | Error> {
    const [ctb64, ivb64] = data.split("?iv=");
    const normalizedKey = getNormalizedX(sharedSecret);

    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        normalizedKey,
        { name: "AES-CBC" },
        false,
        ["decrypt"],
    );
    let ciphertext: BufferSource;
    let iv: BufferSource;
    try {
        ciphertext = decodeBase64(ctb64);
        iv = decodeBase64(ivb64);
    } catch (e) {
        return new Error(`failed to decode, ${e}`);
    }

    try {
        const plaintext = await crypto.subtle.decrypt(
            { name: "AES-CBC", iv },
            cryptoKey,
            ciphertext,
        );
        const text = utf8Decode(plaintext);
        return text;
    } catch (e) {
        return new Error(`failed to decrypt, ${e}`);
    }
}

export function utf8Encode(str: string) {
    let encoder = new TextEncoder();
    return encoder.encode(str);
}

export function utf8Decode(bin: Uint8Array | ArrayBuffer): string {
    let decoder = new TextDecoder();
    return decoder.decode(bin);
}

function toBase64(uInt8Array: Uint8Array) {
    let strChunks = new Array(uInt8Array.length);
    let i = 0;
    // @ts-ignore
    for (let byte of uInt8Array) {
        strChunks[i] = String.fromCharCode(byte); // bytes to utf16 string
        i++;
    }
    return btoa(strChunks.join(""));
}

function decodeBase64(base64String: string) {
    const binaryString = atob(base64String);
    const length = binaryString.length;
    const bytes = new Uint8Array(length);

    for (let i = 0; i < length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

function getNormalizedX(key: Uint8Array): Uint8Array {
    return key.slice(1, 33);
}

function randomBytes(bytesLength: number = 32) {
    return crypto.getRandomValues(new Uint8Array(bytesLength));
}

export function utf16Encode(str: string): number[] {
    let array = new Array(str.length);
    for (let i = 0; i < str.length; i++) {
        array[i] = str.charCodeAt(i);
    }
    return array;
}