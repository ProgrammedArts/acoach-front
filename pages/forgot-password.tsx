import { FormEvent, useState } from 'react'
import isEmail from 'validator/lib/isEmail'
import ErrorMessage from '../components/ErrorMessage'
import FormInput from '../components/FormInput'
import FormSubmit from '../components/FormSubmit'
import getStrapGQLError from '../helpers/getStrapiGQLError'
import useUser from '../hooks/useUser'
import useUserRedirection from '../hooks/useUserRedirection'
import styles from './forgot-password.module.scss'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [requestPending, setRequestPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const { forgotPassword } = useUser()

  useUserRedirection({
    onUnauthenticated: null,
    onAuthenticated: ({ replace }) => replace('/pricing'),
    onBlocked: ({ replace }) => replace('/'),
    onSuspended: ({ replace }) => replace('/'),
    onSubscribedUser: ({ replace }) => replace('/'),
  })

  async function submitResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // validate form
    if (!isEmail(email)) {
      setErrorMessage('Veuillez entrer une adresse e-mail valide.')
      setEmailSent(false)
      return
    }

    setRequestPending(true)
    try {
      await forgotPassword({ email })
      setEmailSent(true)
      setErrorMessage('')
    } catch (error) {
      const strapiError = getStrapGQLError(error)
      if (strapiError?.id === 'Auth.form.error.user.not-exist') {
        setEmailSent(true)
        setErrorMessage('')
      } else {
        setEmailSent(false)
        setErrorMessage('Une erreur serveur est survenue.')
      }
    }
    setRequestPending(false)
  }

  return (
    <div className={styles.ForgotPassword}>
      <h1>Mot de passe oublié</h1>
      <div className={styles.explanation}>
        Si vous avez oublié votre mot de passe vous pouvez le réinitialiser. Pour ce faire, veuillez
        entre votre adresse e-mail
      </div>
      <form onSubmit={submitResetPassword}>
        <FormInput
          label="Adresse e-mail"
          id="email"
          onChange={({ target: { value } }) => setEmail(value)}
        />
        {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
        {emailSent && (
          <p className={styles.emailSent}>
            Veuillez cliquer sur le lien que vous allez recevoir dans votre boîte de réception afin
            de réinitialiser votre mot de passe.
          </p>
        )}
        <FormSubmit disabled={requestPending} role="button">
          Rénitialiser le mot de passe
        </FormSubmit>
      </form>
    </div>
  )
}
