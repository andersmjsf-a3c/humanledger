export default function Login() {
  return (
    <main>
      <h1>Sign in</h1>
      <p>We'll email you a link. No password, and your email is the only thing we keep about you.</p>
      <form method="post" action="/api/auth/request">
        <label>
          Email <input type="email" name="email" required autoComplete="email" />
        </label>{" "}
        <button type="submit">Send link</button>
      </form>
    </main>
  );
}
