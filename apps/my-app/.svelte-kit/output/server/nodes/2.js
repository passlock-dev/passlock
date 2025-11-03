import * as universal from '../entries/pages/_page.ts.js';

export const index = 2;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_page.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+page.ts";
export const imports = ["_app/immutable/nodes/2.BSu533d9.js","_app/immutable/chunks/disclose-version.BEb29zvH.js","_app/immutable/chunks/runtime.Cr8GyxOp.js","_app/immutable/chunks/legacy.2yz7lZzA.js","_app/immutable/chunks/svelte-head.DtR8Dm96.js","_app/immutable/chunks/attributes.BeNbGnLQ.js","_app/immutable/chunks/render.BK5RulHW.js","_app/immutable/chunks/store.BHKJAjsl.js","_app/immutable/chunks/index.DixRZ5Av.js"];
export const stylesheets = ["_app/immutable/assets/2.sTI-GHXi.css"];
export const fonts = [];
