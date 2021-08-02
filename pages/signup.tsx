import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import useUser from "../hooks/useUser";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordCheck, setPasswordCheck] = useState("");

  const { signUp } = useUser();
  const { push } = useRouter();

  function submitSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // validate form
    if (!name) {
      return;
    }
    if (!email) {
      return;
    }
    if (!password) {
      return;
    }
    if (!passwordCheck) {
      return;
    }

    signUp({ realname: name, email, password }).then(() => {
      push("/");
    });
  }

  return (
    <div>
      <form onSubmit={submitSignUp}>
        <input
          placeholder="Nom"
          onChange={({ target: { value } }) => setName(value)}
        />
        <input
          placeholder="Addresse électronique"
          onChange={({ target: { value } }) => setEmail(value)}
        />
        <input
          placeholder="Mot de passe"
          onChange={({ target: { value } }) => setPassword(value)}
        />
        <input
          placeholder="Confirmez votre mot de passe"
          onChange={({ target: { value } }) => setPasswordCheck(value)}
        />
        <button type="submit">S&apos;enregistrer</button>
      </form>
    </div>
  );
}
