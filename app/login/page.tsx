export const metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  email: "That doesn't look like an email address. Try again.",
  send: "We couldn't send the email just now. Wait a minute and try again.",
  expired: "That link has expired or was already used. Ask for a new one.",
};

export default async function Login({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const { sent, error } = await searchParams;
  return (
    <main className="signin">
      <h1>Sign in to keep what you make.</h1>
      {sent ? (
        <div className="card">
          <h3>Check your email</h3>
          <p>
            If that address is valid, a sign-in link is on its way. It works once and expires in 15 minutes. Nothing after a few
            minutes? Check your spam folder, or <a href="/login">send another</a>.
          </p>
        </div>
      ) : (
        <>
          <p className="lede">We&apos;ll email you a link. No password to remember, and none for us to keep.</p>
          {error && ERRORS[error] && <p className="message">{ERRORS[error]}</p>}
          <form method="post" action="/api/auth/request" className="signin-form">
            <label className="flabel" htmlFor="email">
              Email
            </label>
            <input id="email" type="email" name="email" required autoComplete="email" />
            <button className="primary" type="submit">
              Send me a link
            </button>
          </form>
        </>
      )}
      <div className="privacy-lines">
        <p>
          <strong>What we store:</strong> your account and the soundings you choose to send.
        </p>
        <p>
          <strong>What we never see:</strong> your files. <a href="/privacy">How that works</a>.
        </p>
        <p>Signing in opens your account. It does not open your vault.</p>
      </div>
    </main>
  );
}
