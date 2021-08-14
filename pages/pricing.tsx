import { gql, useQuery, useMutation } from "@apollo/client";

const GET_PRICING = gql`
  query {
    subscriptions {
      id
      name
      description
      price
    }
  }
`;

const FIND_CUSTOMER = gql`
  mutation Checkout($subscriptionId: ID!) {
    createCheckout(input: { subscriptionId: $subscriptionId }) {
      url
    }
  }
`;

export interface Pricing {
  name: string;
  price: number;
  id: string;
}

export interface CreateCheckoutResponse {
  data: {
    createCheckout: {
      url: string;
    };
  };
}

export default function Pricing() {
  const { data } = useQuery<{ subscriptions: Pricing[] }>(GET_PRICING);
  const [checkoutMutation] = useMutation(FIND_CUSTOMER);

  const createCustomer = (id: string) => {
    checkoutMutation({ variables: { subscriptionId: id } }).then(
      ({
        data: {
          createCheckout: { url },
        },
      }) => {
        window.open(url, "_self");
      }
    );
  };

  return (
    <div>
      {data ? (
        <div>
          {data.subscriptions.map(({ name, price, id }) => (
            <div onClick={() => createCustomer(id)} key={name}>
              {name}
              <br />
              {(price / 100).toFixed(2)}€
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
