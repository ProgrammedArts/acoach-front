import { gql, useQuery, useMutation } from '@apollo/client'
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
