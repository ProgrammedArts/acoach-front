import isStrongPassword from 'validator/lib/isStrongPassword'

export default function validatePassword(password: string) {
  return isStrongPassword(password, {
    minLength: 8,
    minLowercase: 0,
    minUppercase: 0,
    minNumbers: 1,
    minSymbols: 0,
    returnScore: false,
  })
}
