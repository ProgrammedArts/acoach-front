import { ChangeEvent, Dispatch, FormEvent, SetStateAction, useState } from 'react'
import ErrorMessage from '../../components/ErrorMessage'
import FormInput from '../../components/FormInput'
import FormSubmit from '../../components/FormSubmit'
import SuccessMessage from '../../components/SuccessMessage'
import getStrapGQLError from '../../helpers/getStrapiGQLError'
import validatePassword from '../../helpers/validatePassword'
import useUser from '../../hooks/useUser'
import useUserRedirection from '../../hooks/useUserRedirection'
import styles from './password.module.scss'

export default function ChangePassword() {
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [requestPending, setRequestPending] = useState(false)

  const { changePassword } = useUser()

  const onChangeFactory =
    (changeFn: Dispatch<SetStateAction<string>>) =>
    ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
      changeFn(value)

  useUserRedirection({
    onUnauthenticated: ({ replace }) => replace('/login'),
    onAuthenticated: null,
    onBlocked: null,
    onSubscribedUser: null,
    onSuspended: null,
  })

  async function submitChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // validate both passwords
    if (!validatePassword(password)) {
      setErrorMessage("Le mot de passe actuel n'est pas valide.")
      return
    }

    if (!validatePassword(newPassword)) {
      setErrorMessage(
        'Le nouveau mot de passe doit avoir au moins 8 caractères et au moins 1 chiffre.'
      )
      return
    }

    if (password === newPassword) {
      setErrorMessage("Le nouveau mot de passe ne peut pas être le même que l'ancien.")
      return
    }

    if (newPassword !== newPasswordConfirmation) {
      setErrorMessage(
        'Le nouveau mot de passe et la confirmation du mot de passe doivent être les mêmes.'
      )
      return
    }

    setRequestPending(true)
    try {
      await changePassword({
        password,
        newPassword,
      })
      setSuccessMessage('Mot de passe modifié avec succès.')
      setPassword('')
      setNewPassword('')
      setNewPasswordConfirmation('')
    } catch (e) {
      const strapiError = getStrapGQLError(e)
      if (strapiError?.id === 'current.password.invalid') {
        setErrorMessage("Le mot de passe actuel n'est pas valide.")
      } else {
        setErrorMessage('Une erreur serveur est survenue. Veuillez réessayer ultérieurement.')
      }
    }
    setRequestPending(false)
  }

  return (
    <form className={styles.ChangePassword} onSubmit={submitChangePassword}>
      <h1>Changement de mot de passe</h1>
      <FormInput
        type="password"
        label="Mot de passe actuel"
        id="current-password"
        onChange={onChangeFactory(setPassword)}
        value={password}
      />
      <FormInput
        type="password"
        label="Nouveau mot de passe"
        id="new-password"
        onChange={onChangeFactory(setNewPassword)}
        value={newPassword}
      />
      <FormInput
        type="password"
        label="Confirmez le nouveau mot de passe"
        id="new-password-confirmation"
        onChange={onChangeFactory(setNewPasswordConfirmation)}
        value={newPasswordConfirmation}
      />
      {errorMessage && !successMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
      {successMessage && <SuccessMessage>{successMessage}</SuccessMessage>}
      <FormSubmit
        disabled={requestPending}
        status={successMessage ? 'success' : errorMessage ? 'error' : 'default'}
        role="button"
      >
        Changer le mot de passe
      </FormSubmit>
    </form>
  )
}
