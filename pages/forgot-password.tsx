import { FormEvent, useState } from 'react'
import FormInput from '../components/FormInput'
import FormSubmit from '../components/FormSubmit'
import useUser from '../hooks/useUser'
import styles from './forgot-password.module.scss'

export default function Login() {
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [requestPending, setRequestPending] = useState(false)

  const { forgotPassword } = useUser()

  function submitResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // validate form
    if (!email) {
      return
    }

    setRequestPending(true)
    forgotPassword({ email }).then(() => {
      setRequestPending(false)
      setEmailSent(true)
    })
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
          label="Addresse électronique"
          id="email"
          onChange={({ target: { value } }) => setEmail(value)}
        />
        {emailSent && (
          <p className={styles.emailSent}>
            Veuillez cliquer sur le lien que vous allez recevoir dans votre boîte de réception afin
            de réinitialiser votre mot de passe.
          </p>
        )}
        <FormSubmit disabled={requestPending}>Rénitialiser le mot de passe</FormSubmit>
      </form>
    </div>
  )
}
