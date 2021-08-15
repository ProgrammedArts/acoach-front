import { useRouter } from 'next/router'
import { FormEvent, useState } from 'react'
import FormInput from '../components/FormInput'
import FormSubmit from '../components/FormSubmit'
import useUser from '../hooks/useUser'
import styles from './reset-password.module.scss'
import isEmail from 'validator/lib/isEmail'
import validatePassword from '../helpers/validatePassword'
import ErrorMessage from '../components/ErrorMessage'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [requestPending, setRequestPending] = useState(false)

  const { resetPassword } = useUser()
  const { push, query } = useRouter()

  async function submitResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // validate form
    if (!isEmail(email)) {
      setErrorMessage('Veuillez entrer une adresse e-mail valide')
      return
    }
    if (!validatePassword(password)) {
      setErrorMessage('Le mot de passe doit avoir au moins 8 caractères et au moins 1 chiffre')
      return
    }
    if (password !== passwordConfirmation) {
      setErrorMessage('Le mot de passe et la confirmation du mot de passe doivent être les mêmes')
      return
    }

    setRequestPending(true)
    try {
      if (typeof query.code === 'string') {
        await resetPassword({ password, passwordConfirmation, code: query.code })
        push('/')
      } else {
        throw new Error('Reset code is invalid')
      }
    } catch (e) {
      setErrorMessage('Une erreur est survenue. Veuillez réessayer ultérieurement.')
    }
    setRequestPending(false)
  }

  return (
    <form className={styles.ResetPassword} onSubmit={submitResetPassword}>
      <h1>Réinitialisation du mot de passe</h1>
      <p className={styles.explanation}>
        Si vous avez oublié votre mot de passe veuillez le réinitialiser en entrant un nouveau mot
        de passe.
      </p>
      <FormInput
        label="Addresse électronique"
        id="email"
        onChange={({ target: { value } }) => setEmail(value)}
        value={email}
      />
      <FormInput
        type="password"
        label="Mot de passe"
        id="password"
        onChange={({ target: { value } }) => setPassword(value)}
        value={password}
      />
      <FormInput
        type="password"
        label="Confirmez votre mot de passe"
        id="password-confirmation"
        onChange={({ target: { value } }) => setPasswordConfirmation(value)}
        value={passwordConfirmation}
      />
      {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
      <FormSubmit disabled={requestPending}>Confirmer le nouveau mot de passe</FormSubmit>
    </form>
  )
}
