import { gql, useMutation } from '@apollo/client'
import { useRouter } from 'next/router'
import { useEffect, useState, FormEvent, ChangeEvent, Dispatch, SetStateAction } from 'react'
import ErrorMessage from '../../components/ErrorMessage'
import FormInput from '../../components/FormInput'
import FormSubmit from '../../components/FormSubmit'
import { CustomerPortal } from '../../components/HeaderNavigation'
import SuccessMessage from '../../components/SuccessMessage'
import validatePassword from '../../helpers/validatePassword'
import useUser from '../../hooks/useUser'
import styles from './password.module.scss'

const CHANGE_PASSWORD_MUTATION = gql`
  mutation ChangePassword($password: String!, $newPassword: String!) {
    changePassword(input: { password: $password, newPassword: $newPassword }) {
      email
    }
  }
`

export default function ChangePassword() {
  const { isLoggedIn } = useUser()
  const { push } = useRouter()
  const [changePasswordMutation] =
    useMutation<{ getCustomerPortal: CustomerPortal }>(CHANGE_PASSWORD_MUTATION)
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [requestPending, setRequestPending] = useState(false)

  const onChangeFactory =
    (changeFn: Dispatch<SetStateAction<string>>) =>
    ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
      changeFn(value)

  // redirect to home if not logged
  useEffect(() => {
    if (!isLoggedIn()) {
      push('/')
    }
  }, [isLoggedIn, push])

  async function submitChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // validate both passwords
    if (!validatePassword(password)) {
      setErrorMessage('Le mot de passe actuel est invalide')
      return
    }

    if (!validatePassword(newPassword)) {
      setErrorMessage(
        'Le nouveau mot de passe doit avoir au moins 8 caractères et au moins 1 chiffre'
      )
      return
    }

    if (password === newPassword) {
      setErrorMessage("Le nouveau mot de passe ne peut pas être le même que l'ancien")
      return
    }

    if (newPassword !== newPasswordConfirmation) {
      setErrorMessage(
        'Le nouveau mot de passe et la confirmation du mot de passe doivent être les mêmes'
      )
      return
    }

    setRequestPending(true)
    try {
      await changePasswordMutation({
        variables: {
          password,
          newPassword,
        },
      })
      setSuccessMessage('Mot de passe modifié avec succès')
      setPassword('')
      setNewPassword('')
      setNewPasswordConfirmation('')
    } catch (e) {
      setErrorMessage('Une erreur est survenue. Veuillez réessayer ultérieurement.')
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
      >
        Changer le mot de passe
      </FormSubmit>
    </form>
  )
}
