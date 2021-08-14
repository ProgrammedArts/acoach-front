import { ApolloError } from "@apollo/client";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import Link from "next/link";
import useUser from "../hooks/useUser";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login, sendEmailConfirmation } = useUser();
  const { push } = useRouter();

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // validate form
    if (!email) {
      return;
    }
    if (!password) {
      return;
    }

    login({ email, password }).then(
      () => {
        push("/");
      },
      ({ graphQLErrors }: ApolloError) => {
        console.log(graphQLErrors[0]);
        if (
          graphQLErrors[0]?.extensions?.exception.data.message[0].messages[0]
            .id === "Auth.form.error.confirmed"
        ) {
          sendEmailConfirmation({ email }).then(() => {
            alert("Hell yeah");
          });
        }
      }
    );
  }

  return (
    <div>
      <form onSubmit={submitLogin}>
        <input
          placeholder="Addresse électronique"
          onChange={({ target: { value } }) => setEmail(value)}
        />
        <input
          placeholder="Mot de passe"
          onChange={({ target: { value } }) => setPassword(value)}
        />
        <button type="submit">Connexion</button>
      </form>
      <Link
        href={{
          pathname: "/forgot-password",
          query: {
            email,
          },
        }}
      >
        Mot de passe oublié
      </Link>
    </div>
  );
}
