import { FormEvent, useState } from "react";
import useUser from "../hooks/useUser";

export default function Login() {
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const { forgotPassword } = useUser();

  function submitResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // validate form
    if (!email) {
      return;
    }

    forgotPassword({ email }).then(() => {
      setEmailSent(true);
    });
  }

  return (
    <div>
      <form onSubmit={submitResetPassword}>
        <input
          placeholder="Addresse électronique"
          onChange={({ target: { value } }) => setEmail(value)}
        />
        <button type="submit">Rénitialiser le mot de passe</button>
      </form>
      {emailSent && <p>Email envoyé.</p>}
    </div>
  );
}
