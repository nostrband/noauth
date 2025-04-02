import{MT as s,NUMBYTES as l,SYMS as d}from"./constants.js";import{base64ToBytes as m,hexToU8 as b,subarrayRanges as u}from"./utils.js";import{Simple as E}from"./simple.js";import{parseHalf as g}from"./float.js";const p=new TextDecoder("utf8",{fatal:!0,ignoreBOM:!0});class y{static defaultOptions={maxDepth:1024,encoding:"hex",requirePreferred:!1};#t;#r;#e=0;#i;constructor(t,r){if(this.#i={...y.defaultOptions,...r},typeof t=="string")switch(this.#i.encoding){case"hex":this.#t=b(t);break;case"base64":this.#t=m(t);break;default:throw new TypeError(`Encoding not implemented: "${this.#i.encoding}"`)}else this.#t=t;this.#r=new DataView(this.#t.buffer,this.#t.byteOffset,this.#t.byteLength)}toHere(t){return u(this.#t,t,this.#e)}*[Symbol.iterator](){if(yield*this.#n(0),this.#e!==this.#t.length)throw new Error("Extra data in input")}*#n(t){if(t++>this.#i.maxDepth)throw new Error(`Maximum depth ${this.#i.maxDepth} exceeded`);const r=this.#e,c=this.#r.getUint8(this.#e++),i=c>>5,n=c&31;let e=n,f=!1,a=0;switch(n){case l.ONE:if(a=1,e=this.#r.getUint8(this.#e),i===s.SIMPLE_FLOAT){if(e<32)throw new Error(`Invalid simple encoding in extra byte: ${e}`);f=!0}else if(this.#i.requirePreferred&&e<24)throw new Error(`Unexpectedly long integer encoding (1) for ${e}`);break;case l.TWO:if(a=2,i===s.SIMPLE_FLOAT)e=g(this.#t,this.#e);else if(e=this.#r.getUint16(this.#e,!1),this.#i.requirePreferred&&e<=255)throw new Error(`Unexpectedly long integer encoding (2) for ${e}`);break;case l.FOUR:if(a=4,i===s.SIMPLE_FLOAT)e=this.#r.getFloat32(this.#e,!1);else if(e=this.#r.getUint32(this.#e,!1),this.#i.requirePreferred&&e<=65535)throw new Error(`Unexpectedly long integer encoding (4) for ${e}`);break;case l.EIGHT:{if(a=8,i===s.SIMPLE_FLOAT)e=this.#r.getFloat64(this.#e,!1);else if(e=this.#r.getBigUint64(this.#e,!1),e<=Number.MAX_SAFE_INTEGER&&(e=Number(e)),this.#i.requirePreferred&&e<=4294967295)throw new Error(`Unexpectedly long integer encoding (8) for ${e}`);break}case 28:case 29:case 30:throw new Error(`Additional info not implemented: ${n}`);case l.INDEFINITE:switch(i){case s.POS_INT:case s.NEG_INT:case s.TAG:throw new Error(`Invalid indefinite encoding for MT ${i}`);case s.SIMPLE_FLOAT:yield[i,n,d.BREAK,r,0];return}e=1/0;break;default:f=!0}switch(this.#e+=a,i){case s.POS_INT:yield[i,n,e,r,a];break;case s.NEG_INT:yield[i,n,typeof e=="bigint"?-1n-e:-1-Number(e),r,a];break;case s.BYTE_STRING:e===1/0?yield*this.#s(i,t,r):yield[i,n,this.#a(e),r,e];break;case s.UTF8_STRING:e===1/0?yield*this.#s(i,t,r):yield[i,n,p.decode(this.#a(e)),r,e];break;case s.ARRAY:if(e===1/0)yield*this.#s(i,t,r,!1);else{const o=Number(e);yield[i,n,o,r,a];for(let h=0;h<o;h++)yield*this.#n(t+1)}break;case s.MAP:if(e===1/0)yield*this.#s(i,t,r,!1);else{const o=Number(e);yield[i,n,o,r,a];for(let h=0;h<o;h++)yield*this.#n(t),yield*this.#n(t)}break;case s.TAG:yield[i,n,e,r,a],yield*this.#n(t);break;case s.SIMPLE_FLOAT:{const o=e;f&&(e=E.create(Number(e))),yield[i,n,e,r,o];break}}}#a(t){const r=u(this.#t,this.#e,this.#e+=t);if(r.length!==t)throw new Error(`Unexpected end of stream reading ${t} bytes, got ${r.length}`);return r}*#s(t,r,c,i=!0){for(yield[t,l.INDEFINITE,1/0,c,1/0];;){const n=this.#n(r),e=n.next(),[f,a,o]=e.value;if(o===d.BREAK){yield e.value,n.next();return}if(i){if(f!==t)throw new Error(`Unmatched major type.  Expected ${t}, got ${f}.`);if(a===l.INDEFINITE)throw new Error("New stream started in typed stream")}yield e.value,yield*n}}}export{y as DecodeStream};
