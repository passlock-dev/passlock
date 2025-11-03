import * as server from '../entries/pages/sverdle/_page.server.ts.js';

export const index = 4;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/sverdle/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/sverdle/+page.server.ts";
export const imports = ["_app/immutable/nodes/4.CFzc3jam.js","_app/immutable/chunks/disclose-version.BEb29zvH.js","_app/immutable/chunks/runtime.Cr8GyxOp.js","_app/immutable/chunks/render.BK5RulHW.js","_app/immutable/chunks/svelte-head.DtR8Dm96.js","_app/immutable/chunks/props.DZvJ21qY.js","_app/immutable/chunks/store.BHKJAjsl.js","_app/immutable/chunks/attributes.BeNbGnLQ.js","_app/immutable/chunks/entry.-mXGl6Ft.js","_app/immutable/chunks/index.DixRZ5Av.js"];
export const stylesheets = ["_app/immutable/assets/4.yeGN9jlM.css"];
export const fonts = [];
