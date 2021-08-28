import Link from 'next/link'
import { FormEvent, MouseEvent, ReactNode, useState } from 'react'
import isEmail from 'validator/lib/isEmail'
import ErrorMessage from '../components/ErrorMessage'
import FormInput from '../components/FormInput'
import FormSubmit from '../components/FormSubmit'
import getStrapGQLError from '../helpers/getStrapiGQLError'
import validatePassword from '../helpers/validatePassword'
import useUser from '../hooks/useUser'
import useUserRedirection from '../hooks/useUserRedirection'
import styles from './login.module.scss'

export default function Login({ children }: { children?: ReactNode }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [requestPending, setRequestPending] = useState(false)
  const [shouldConfirmEmail, setShouldConfirmEmail] = useState(false)
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false)

  const { login, sendEmailConfirmation } = useUser()

  useUserRedirection({
    onUnauthenticated: null,
    onAuthenticated: ({ replace }) => replace('/pricing'),
    onBlocked: ({ replace }) => replace('/?blocked=true'),
    onSuspended: ({ replace }) => replace('/?suspended=true'),
    onSubscribedUser: ({ replace }) => replace('/'),
  })

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // validate form
    if (!isEmail(email)) {
      setErrorMessage('Veuillez entrer une adresse e-mail valide.')
      return
    }
    if (!validatePassword(password)) {
      setErrorMessage('Veuillez entrer un mot de passe valide.')
      return
    }

    setRequestPending(true)
    try {
      await login({ email, password })
    } catch (error) {
      const strapiError = getStrapGQLError(error)
      if (strapiError?.id === 'Auth.form.error.confirmed') {
        setErrorMessage('')
        setShouldConfirmEmail(true)
      } else if (strapiError?.id === 'Auth.form.error.invalid') {
        setErrorMessage("L'adresse e-mail et/ou le mot de passe n'est pas valide")
      } else {
        setErrorMessage('Une erreur serveur est survenue.')
      }
    }
    setRequestPending(false)
  }

  function clickSendEmailConfirmation(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()

    sendEmailConfirmation({ email }).then(
      () => {
        setErrorMessage('')
        setEmailConfirmationSent(true)
      },
      () => {
        setErrorMessage('Une erreur serveur est survenue.')
      }
    )
  }

  return (
    <div className={styles.Login}>
      {!shouldConfirmEmail && (
        <>
          {children ? children : <h1>Connexion</h1>}
          <form onSubmit={submitLogin}>
            <FormInput
              label="Adresse e-mail"
              id="email"
              onChange={({ target: { value } }) => setEmail(value)}
            />
            <FormInput
              type="password"
              label="Mot de passe"
              id="password"
              onChange={({ target: { value } }) => setPassword(value)}
            />
            {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
            <FormSubmit disabled={requestPending} role="button">
              Connexion
            </FormSubmit>
          </form>
          <div className={styles.forgotPassword}>
            <Link
              href={{
                pathname: '/forgot-password',
                query: {
                  email,
                },
              }}
            >
              Mot de passe oublié
            </Link>
          </div>
        </>
      )}
      {shouldConfirmEmail && (
        <>
          {!emailConfirmationSent && (
            <div className={styles.sendEmailConfirmation}>
              Pour continuer à utiliser votre compte, veuillez confirmer votre adresse e-mail en
              cliquant sur le lien que vous avez reçu dans votre boîte de réception. Si vous ne
              l&apos;avez pas reçu vous pouvez recevoir le lien une nouvelle fois en{' '}
              <a href="" onClick={clickSendEmailConfirmation}>
                cliquant ici
              </a>
              .
            </div>
          )}
          {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
          {emailConfirmationSent && (
            <div className={styles.sendEmailConfirmation}>
              Vous allez recevoir un e-mail avec un lien pour confirmer votre adresse e-mail.
            </div>
          )}
        </>
      )}
    </div>
  )
}
