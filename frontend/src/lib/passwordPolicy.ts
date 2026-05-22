export const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;

export const PASSWORD_POLICY_MESSAGE =
  'La contraseña debe tener al menos 12 caracteres, una mayúscula, una minúscula, un número y un carácter especial';

export function isStrongPassword(value: string) {
  return PASSWORD_POLICY_REGEX.test(value);
}
