import { gql, useQuery, useMutation } from '@apollo/client'
import { useRouter } from 'next/router'
import { useCallback, useEffect } from 'react'
import useUser from '../hooks/useUser'
import { UserState } from '../providers/UserProvider'
import styles from './pricing.module.scss'

const GET_PRICING = gql`
  query {
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
  const { data } = useQuery<{ subscriptions: Pricing[] }>(GET_PRICING)
  const [checkoutMutation] = useMutation(FIND_CUSTOMER)

  const { me, isLoggedIn } = useUser()
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
      }
    },
    [push]
  )

  useEffect(() => {
    if (isLoggedIn() && me) {
      redirectAuthenticatedUser(me)
    }
  }, [me, isLoggedIn, push, redirectAuthenticatedUser])

  const createCustomer = (id: string) => {
    checkoutMutation({ variables: { subscriptionId: id } }).then(
      ({
        data: {
          createCheckout: { url },
        },
      }) => {
        window.open(url, '_self')
      }
    )
  }

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
    </div>
  )
}
