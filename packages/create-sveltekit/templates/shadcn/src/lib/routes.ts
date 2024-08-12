import { route } from './routing.js'

export const app = route({ routeId: '/(app)/app' })
export const login = route({ routeId: '/(other)/login' })
export const registerAction = route({ routeId: '/(other)/register/action' })
export const loginAction = route({ routeId: '/(other)/login/action' })
export const logoutAction = route({ routeId: '/(other)/logout/action' })

export const verifyEmailLink = route({ routeId: '/(other)/verify-email/link' })
export const verifyEmailCode = route({ routeId: '/(other)/verify-email/code' })
export const verifyEmailAwaitLink = route({ routeId: '/(other)/verify-email/awaiting-link' })
