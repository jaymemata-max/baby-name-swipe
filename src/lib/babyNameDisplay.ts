export const BABY_SURNAME = 'Mata';

export function formatBabyName(givenName: string) {
  return `${givenName} ${BABY_SURNAME}`;
}
