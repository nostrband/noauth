const f={POS_INT:0,NEG_INT:1,BYTE_STRING:2,UTF8_STRING:3,ARRAY:4,MAP:5,TAG:6,SIMPLE_FLOAT:7},I={DATE_STRING:0,DATE_EPOCH:1,POS_BIGINT:2,NEG_BIGINT:3,DECIMAL_FRAC:4,BIGFLOAT:5,BASE64URL_EXPECTED:21,BASE64_EXPECTED:22,BASE16_EXPECTED:23,CBOR:24,URI:32,BASE64URL:33,BASE64:34,MIME:36,SET:258,JSON:262,REGEXP:21066,SELF_DESCRIBED:55799,INVALID_16:65535,INVALID_32:4294967295,INVALID_64:0xffffffffffffffffn},o={ZERO:0,ONE:24,TWO:25,FOUR:26,EIGHT:27,INDEFINITE:31},T={FALSE:20,TRUE:21,NULL:22,UNDEFINED:23};class N{static BREAK=Symbol.for("github.com/hildjj/cbor2/break");static ENCODED=Symbol.for("github.com/hildjj/cbor2/cbor-encoded");static LENGTH=Symbol.for("github.com/hildjj/cbor2/length")}const S={MIN:-(2n**63n),MAX:2n**64n-1n};export{S as DCBOR_INT,f as MT,o as NUMBYTES,T as SIMPLE,N as SYMS,I as TAG};
