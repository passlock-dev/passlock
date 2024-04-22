/**
 * Store the email in local storage so they don't 
 * need to re-enter it during subsequent authentication
 * 
 * @param email 
 * @returns 
 */
export const saveEmailLocally = (email: string) => localStorage.setItem('email', email)

export const getLocalEmail = () => localStorage.getItem('email')