import { gql, useQuery, useMutation } from "@apollo/client";
import useUser from "../hooks/useUser";

const GET_PRICING = gql`
  query {
    subscriptions {
      name
      price
      stripePriceId
    }
  }
`;

const FIND_CUSTOMER = gql`
  mutation FindCustomer($email: String!) {
    findCustomer(input: { email: $email }) {
      email
    }
  }
`;

export interface Pricing {
  name: string;
  price: number;
  stripePriceId: string;
}

export default function Pricing() {
  const { data } = useQuery<{ subscriptions: Pricing[] }>(GET_PRICING);
  const { me } = useUser();
  const [findCustomerMutation] = useMutation(FIND_CUSTOMER);

  const createCustomer = () => {
    findCustomerMutation({ variables: { email: me?.email } });
  };

  return (
    <div>
      {data ? (
        <div>
          {data.subscriptions.map(({ name, price }) => (
            <div onClick={createCustomer} key={name}>
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
