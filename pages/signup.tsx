import Link from 'next/link'
import React, { FormEvent, useState } from 'react'
import isEmail from 'validator/lib/isEmail'
import ErrorMessage from '../components/ErrorMessage'
import FormInput from '../components/FormInput'
import FormSubmit from '../components/FormSubmit'
import SuccessMessage from '../components/SuccessMessage'
import getStrapGQLError from '../helpers/getStrapiGQLError'
import validatePassword from '../helpers/validatePassword'
import useUser from '../hooks/useUser'
import useUserRedirection from '../hooks/useUserRedirection'
import styles from './signup.module.scss'

export default function SignUp() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordCheck, setPasswordCheck] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [requestPending, setRequestPending] = useState(false)

  const { signUp } = useUser()

  useUserRedirection({
    onUnauthenticated: null,
    onSuspended: ({ replace }) => replace('/'),
    onBlocked: ({ replace }) => replace('/'),
    onAuthenticated: ({ replace }) => replace('/'),
    onSubscribedUser: ({ replace }) => replace('/'),
  })

  async function submitSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // validate form
    if (!name) {
      setErrorMessage('Veuillez entrer un nom.')
      return
    }
    if (!isEmail(email)) {
      setErrorMessage('Veuillez entrer une adresse e-mail valide.')
      return
    }
    if (!validatePassword(password)) {
      setErrorMessage('Le mot de passe doit avoir au moins 8 caractères et au moins 1 chiffre.')
      return
    }
    if (password !== passwordCheck) {
      setErrorMessage('Le mot de passe et la confirmation du mot de passe doivent être les mêmes.')
      return
    }

    setRequestPending(true)
    try {
      await signUp({ realname: name, email, password })
      setSuccessMessage(
        'Le compte a été créé avec succès. Veuillez valider votre e-mail en cliquant sur lien que vous allez recevoir dans votre boîte de réception.'
      )
      setName('')
      setEmail('')
      setPassword('')
      setPasswordCheck('')
    } catch (e) {
      const strapiError = getStrapGQLError(e)
      if (strapiError?.id === 'Auth.form.error.email.taken') {
        setErrorMessage('Un compte avec cet email existe déjà.')
      } else {
        setErrorMessage('Une erreur serveur est survenue.')
      }
    }
    setRequestPending(false)
  }

  return (
    <form className={styles.SignUp} onSubmit={submitSignUp}>
      <h1>Inscription</h1>
      <div className={styles.loginLink}>
        Déjà inscrit ? <Link href="/login">Se connecter</Link>
      </div>
      <FormInput
        label="Nom"
        id="name"
        onChange={({ target: { value } }) => setName(value)}
        value={name}
      />
      <FormInput
        label="Adresse e-mail"
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
        onChange={({ target: { value } }) => setPasswordCheck(value)}
        value={passwordCheck}
      />
      {errorMessage && !successMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
      {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}
      <FormSubmit
        disabled={requestPending}
        status={successMessage ? 'success' : errorMessage ? 'error' : 'default'}
        role="button"
      >
        S&apos;enregistrer
      </FormSubmit>
    </form>
  )
}
