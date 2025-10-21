export type { RegistrationOptions, RegistrationResponse, RegistrationError } from './registration/micro'
export { registerPasskey } from './registration/index'

export type { AuthenticationOptions, AuthenticationResponse, AuthenticationError } from "./authentication/micro"
export { authenticatePasskey } from './authentication/index'