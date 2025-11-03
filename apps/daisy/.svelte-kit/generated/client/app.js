export { matchers } from './matchers.js';

export const nodes = [
	() => import('./nodes/0'),
	() => import('./nodes/1'),
	() => import('./nodes/2'),
	() => import('./nodes/3'),
	() => import('./nodes/4'),
	() => import('./nodes/5'),
	() => import('./nodes/6'),
	() => import('./nodes/7'),
	() => import('./nodes/8'),
	() => import('./nodes/9'),
	() => import('./nodes/10'),
	() => import('./nodes/11'),
	() => import('./nodes/12')
];

export const server_loads = [2];

export const dictionary = {
		"/(other)": [5,[3]],
		"/(other)/login": [6,[3]],
		"/(other)/login/action": [~7,[3]],
		"/(other)/logout/action": [~8,[3]],
		"/(other)/register/action": [~9,[3]],
		"/(app)/todos": [~4,[2]],
		"/(other)/verify-email/awaiting-link": [~10,[3]],
		"/(other)/verify-email/code": [~11,[3]],
		"/(other)/verify-email/link": [~12,[3]]
	};

export const hooks = {
	handleError: (({ error }) => { console.error(error) }),

	reroute: (() => {})
};

export { default as root } from '../root.js';