import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import useUser from "../hooks/useUser";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login } = useUser();
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

    login({ email, password }).then(() => {
      push("/");
    });
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
    </div>
  );
}
