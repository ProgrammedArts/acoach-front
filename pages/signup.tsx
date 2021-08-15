import { useRouter } from 'next/router'
import Link from 'next/link'
import React, { FormEvent, useState } from 'react'
import FormInput from '../components/FormInput'
import FormSubmit from '../components/FormSubmit'
import useUser from '../hooks/useUser'
import styles from './SignUp.module.scss'
import isEmail from 'validator/lib/isEmail'
import validatePassword from '../helpers/validatePassword'
import ErrorMessage from '../components/ErrorMessage'
import SuccessMessage from '../components/SuccessMessage'

export default function SignUp() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordCheck, setPasswordCheck] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [requestPending, setRequestPending] = useState(false)

  const { signUp } = useUser()

  async function submitSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // validate form
    if (!name) {
      setErrorMessage('Veuillez entrer un nom')
      return
    }
    if (!isEmail(email)) {
      setErrorMessage('Veuillez entrer une adresse e-mail valide')
      return
    }
    if (!validatePassword(password)) {
      setErrorMessage('Le mot de passe doit avoir au moins 8 caractères et au moins 1 chiffre')
      return
    }
    if (password !== passwordCheck) {
      setErrorMessage('Le mot de passe et la confirmation du mot de passe doivent être les mêmes')
      return
    }

    setRequestPending(true)
    try {
      await signUp({ realname: name, email, password })
      setSuccessMessage(
        'Compte créé avec succès. Veuillez valider votre e-mail en cliquant sur lien que vous allez recevoir dans votre boîte mail.'
      )
      setName('')
      setEmail('')
      setPassword('')
      setPasswordCheck('')
    } catch (e) {
      setErrorMessage('Une erreur est survenue. Veuillez réessayer ultérieurement.')
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
      >
        S&apos;enregistrer
      </FormSubmit>
    </form>
  )
}
