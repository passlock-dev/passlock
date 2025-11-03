import * as universal from '../entries/pages/about/_page.ts.js';

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/about/_page.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/about/+page.ts";
export const imports = ["_app/immutable/nodes/3.CfVj3dWs.js","_app/immutable/chunks/index.DQG_RJnh.js","_app/immutable/chunks/runtime.Cr8GyxOp.js","_app/immutable/chunks/disclose-version.BEb29zvH.js","_app/immutable/chunks/legacy.2yz7lZzA.js","_app/immutable/chunks/svelte-head.DtR8Dm96.js"];
export const stylesheets = [];
export const fonts = [];
