import { gql, useMutation, useQuery } from '@apollo/client'
import { useEffect } from 'react'
import { useState } from 'react'
import ErrorMessage from '../components/ErrorMessage'
import useUserRedirection from '../hooks/useUserRedirection'
import styles from './pricing.module.scss'

const GET_PRICING = gql`
  query GetPricing {
    subscriptions {
      id
      name
      description
      price
    }
  }
`

const FIND_CUSTOMER = gql`
  mutation Checkout($subscriptionId: ID!) {
    createCheckout(input: { subscriptionId: $subscriptionId }) {
      url
    }
  }
`

export interface Pricing {
  name: string
  price: number
  id: string
  description: string
}

export interface CreateCheckoutResponse {
  data: {
    createCheckout: {
      url: string
    }
  }
}

export default function Pricing() {
  const { data, error } = useQuery<{ subscriptions: Pricing[] }>(GET_PRICING)
  const [checkoutMutation] = useMutation(FIND_CUSTOMER)
  const [errorMessage, setErrorMessage] = useState('')

  const userSwitch = useUserRedirection({
    auto: false,
  })

  const createCustomer = (id: string) => {
    function attemptCheckout() {
      checkoutMutation({ variables: { subscriptionId: id } }).then(
        ({
          data: {
            createCheckout: { url },
          },
        }) => {
          window.open(url, '_self')
        },
        () => {
          setErrorMessage('Une erreur serveur est survenue.')
        }
      )
    }

    userSwitch({
      onAuthenticated: attemptCheckout,
      onUnauthenticated: ({ push }) => push('/login'),
      onBlocked: () =>
        setErrorMessage(
          "Vous n'êtes pas autorisé à prendre un abonnement. Veuillez nous contacter pour plus d'informations"
        ),
      onSuspended: () =>
        setErrorMessage(
          "Vous n'êtes pas autorisé à prendre un abonnement. Veuillez nous contacter pour plus d'informations"
        ),
      onSubscribedUser: () => setErrorMessage('Vous êtes déjà abonné.'),
    })
  }

  useEffect(() => {
    if (error) {
      setErrorMessage('Une erreur serveur est survenue.')
    } else {
      setErrorMessage('')
    }
  }, [error])

  return (
    <div className={styles.Pricing}>
      {data ? (
        <>
          {data.subscriptions.map(({ name, price, description, id }) => (
            <div className={styles.plan} onClick={() => createCustomer(id)} key={id}>
              <h2>{name}</h2>
              <h3>{(price / 100).toFixed(2)}€</h3>
              {description.split('\n').map((item, key) => (
                <p key={key}>{item}</p>
              ))}
            </div>
          ))}
        </>
      ) : null}
      {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
    </div>
  )
}
