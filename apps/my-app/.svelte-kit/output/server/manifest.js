export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png","robots.txt"]),
	mimeTypes: {".png":"image/png",".txt":"text/plain"},
	_: {
		client: {"start":"_app/immutable/entry/start.DXW_lVtk.js","app":"_app/immutable/entry/app.B4PQYAne.js","imports":["_app/immutable/entry/start.DXW_lVtk.js","_app/immutable/chunks/entry.-mXGl6Ft.js","_app/immutable/chunks/runtime.Cr8GyxOp.js","_app/immutable/chunks/index.DixRZ5Av.js","_app/immutable/entry/app.B4PQYAne.js","_app/immutable/chunks/runtime.Cr8GyxOp.js","_app/immutable/chunks/render.BK5RulHW.js","_app/immutable/chunks/svelte-head.DtR8Dm96.js","_app/immutable/chunks/disclose-version.BEb29zvH.js","_app/immutable/chunks/props.DZvJ21qY.js","_app/immutable/chunks/store.BHKJAjsl.js"],"stylesheets":[],"fonts":[],"uses_env_dynamic_public":false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/4.js'))
		],
		routes: [
			{
				id: "/sverdle",
				pattern: /^\/sverdle\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			}
		],
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
