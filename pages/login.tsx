import { ApolloError } from '@apollo/client'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { FormEvent, ReactNode, useState, useEffect, useCallback, MouseEvent } from 'react'
import FormInput from '../components/FormInput'
import FormSubmit from '../components/FormSubmit'
import useUser from '../hooks/useUser'
import styles from './login.module.scss'
import isEmail from 'validator/lib/isEmail'
import validatePassword from '../helpers/validatePassword'
import ErrorMessage from '../components/ErrorMessage'
import { UserState } from '../providers/UserProvider'

export default function Login({ children }: { children?: ReactNode }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [requestPending, setRequestPending] = useState(false)
  const [shouldConfirmEmail, setShouldConfirmEmail] = useState(false)
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false)

  const { login, sendEmailConfirmation, me, isLoggedIn } = useUser()
  const { push } = useRouter()

  const redirectAuthenticatedUser = useCallback(
    function redirectAuthenticatedUser(user: UserState) {
      const { subscription, subscriptionActive, subscriptionEnd, blocked } = user

      if (
        subscription &&
        subscriptionEnd &&
        new Date(subscriptionEnd).getTime() > Date.now() &&
        subscriptionActive
      ) {
        // has an active subscription
        push('/watch')
      } else if (
        blocked ||
        (subscription &&
          subscriptionEnd &&
          new Date(subscriptionEnd).getTime() > Date.now() &&
          !subscriptionActive)
      ) {
        // is blocked or has his/her subscription terminated manually
        push('/banned')
      } else {
        // no active subscription or subscription expired
        push('/pricing')
      }
    },
    [push]
  )

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
      const { data } = await login({ email, password })
      redirectAuthenticatedUser(data.me)
    } catch (e) {
      const { graphQLErrors }: ApolloError = e
      const id = graphQLErrors[0]?.extensions?.exception.data?.message[0].messages[0].id
      if (id === 'Auth.form.error.confirmed') {
        setErrorMessage('')
        setShouldConfirmEmail(true)
      } else if (id === 'Auth.form.error.invalid') {
        setErrorMessage("L'adresse e-mail et/ou le mot de passe n'est pas valide")
      } else {
        setErrorMessage('Une erreur est survenue. Veuillez réessayer ultérieurement.')
      }
    }
    setRequestPending(false)
  }

  function clickSendEmailConfirmation(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()

    sendEmailConfirmation({ email }).then(() => {
      setEmailConfirmationSent(true)
    })
  }

  useEffect(() => {
    if (isLoggedIn() && me) {
      redirectAuthenticatedUser(me)
    }
  }, [me, isLoggedIn, redirectAuthenticatedUser])

  return (
    <div className={styles.Login}>
      {!shouldConfirmEmail && (
        <>
          {children ? children : <h1>Connexion</h1>}
          <form onSubmit={submitLogin}>
            <FormInput
              label="Addresse électronique"
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
            <FormSubmit disabled={requestPending}>Connexion</FormSubmit>
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
