class i{static#e=new Map;tag;contents;constructor(t,e=void 0){this.tag=t,this.contents=e}get noChildren(){return!!i.#e.get(this.tag)?.noChildren}static registerDecoder(t,e,n){const o=this.#e.get(t);return this.#e.set(t,e),o&&("comment"in e||(e.comment=o.comment),"noChildren"in e||(e.noChildren=o.noChildren)),n&&!e.comment&&(e.comment=()=>`(${n})`),o}static clearDecoder(t){const e=this.#e.get(t);return this.#e.delete(t),e}static getDecoder(t){return this.#e.get(t)}static getAllDecoders(){return new Map(this.#e)}*[Symbol.iterator](){yield this.contents}push(t){return this.contents=t,1}decode(t){const e=i.#e.get(this.tag);return e?e(this,t):this}comment(t,e){const n=i.#e.get(this.tag);if(n?.comment)return n.comment(this,t,e)}toCBOR(){return[this.tag,this.contents]}[Symbol.for("nodejs.util.inspect.custom")](t,e,n){return`${this.tag}(${n(this.contents,e)})`}}export{i as Tag};
