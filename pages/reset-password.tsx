import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import useUser from "../hooks/useUser";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const { resetPassword } = useUser();
  const { push } = useRouter();

  function submitResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // validate form
    if (!email) {
      return;
    }
    if (!password) {
      return;
    }
    if (!passwordConfirmation) {
      return;
    }

    resetPassword({ password, passwordConfirmation, code: "" }).then(() => {
      push("/");
    });
  }

  return (
    <div>
      <form onSubmit={submitResetPassword}>
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
          onChange={({ target: { value } }) => setPasswordConfirmation(value)}
        />
        <button type="submit">Confirmer le nouveau mot de passe</button>
      </form>
    </div>
  );
}
