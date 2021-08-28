import { useRouter } from 'next/router'
import { FormEvent, useState } from 'react'
import ErrorMessage from '../components/ErrorMessage'
import FormInput from '../components/FormInput'
import FormSubmit from '../components/FormSubmit'
import validatePassword from '../helpers/validatePassword'
import useUser from '../hooks/useUser'
import useUserRedirection from '../hooks/useUserRedirection'
import ACUser from '../models/ACUser'
import styles from './reset-password.module.scss'

export default function Login() {
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [requestPending, setRequestPending] = useState(false)

  const { resetPassword } = useUser()
  const { query } = useRouter()

  const redirectUser = useUserRedirection({
    onAuthenticated: ({ replace }) => replace('/pricing'),
    onBlocked: ({ replace }) => replace('/?blocked=true'),
    onSubscribedUser: ({ replace }) => replace('/'),
    onSuspended: ({ replace }) => replace('/?suspended=true'),
    onUnauthenticated: ({ replace }) => replace('/'),
    auto: false,
  })

  async function submitResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // validate form
    if (!validatePassword(password)) {
      setErrorMessage('Le mot de passe doit avoir au moins 8 caractères et au moins 1 chiffre.')
      return
    }
    if (password !== passwordConfirmation) {
      setErrorMessage('Le mot de passe et la confirmation du mot de passe doivent être les mêmes.')
      return
    }

    setRequestPending(true)
    try {
      if (typeof query.code === 'string') {
        const result = await resetPassword({ password, passwordConfirmation, code: query.code })
        const user = result.data.me as Partial<ACUser>
        redirectUser({ user: user as ACUser })
      } else {
        throw new Error('Reset code is invalid')
      }
    } catch (e) {
      setErrorMessage('Une erreur serveur est survenue.')
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
      <FormSubmit disabled={requestPending} role="button">
        Confirmer le nouveau mot de passe
      </FormSubmit>
    </form>
  )
}
