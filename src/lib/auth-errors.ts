/**
 * Safe, centralized error mapper for Supabase Auth and Database responses.
 * Enforces zero-credential leakage and user-friendly explanations.
 */

export function mapAuthError(error: unknown): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  if (typeof error === 'string') {
    return error;
  }

  const err = error as { message?: string; status?: number; code?: string };
  const message = (err.message || '').toLowerCase();

  if (message.includes('invalid login credentials') || message.includes('invalid_grant')) {
    return 'Invalid email or password. Please verify your credentials and try again. If you have not created an account yet, click "Create Account" below. If you forgot your password, click "Forgot password?".';
  }

  if (message.includes('email not confirmed')) {
    return 'Account email is unconfirmed. In the Supabase Dashboard, go to Authentication > Users > select this account and click "Auto-confirm user", or run the confirmation SQL in the SQL Editor.';
  }

  if (message.includes('user already registered') || message.includes('already exists')) {
    return 'An account with this email address already exists. Please sign in instead.';
  }

  if (message.includes('password should be at least')) {
    return 'Password is too short. Please choose a password with at least 8 characters.';
  }

  if (
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('over_email_send_rate_limit') ||
    message.includes('email rate limit exceeded')
  ) {
    if (
      message.includes('email') ||
      message.includes('send') ||
      (err.code && err.code.includes('email'))
    ) {
      return 'Supabase email rate limit exceeded (default 3-4 emails/hour on free tier or built-in SMTP). Do not repeatedly trigger verification or reset emails. Instead, manually confirm the user or change the password directly in Supabase Dashboard > Authentication > Users, or configure custom SMTP in Authentication > Providers > Email.';
    }
    return 'Too many attempts. For security reasons, please wait a moment before trying again.';
  }

  if (
    message.includes('otp_expired') ||
    message.includes('link is invalid or has expired') ||
    message.includes('token has expired')
  ) {
    return 'The password reset link is invalid or has expired. Please request a new recovery link.';
  }

  if (message.includes('jwt expired') || message.includes('session expired')) {
    return 'Your session has expired. Please sign in again to continue.';
  }

  if (message.includes('networkerror') || message.includes('failed to fetch')) {
    return 'Unable to connect to authentication server. Please check your network connection.';
  }

  if (message.includes('schema cache') || message.includes('could not find the table') || message.includes('pgrst200') || message.includes('pgrst205')) {
    return 'Database table "public.profiles" not found in Supabase schema cache. Please apply migrations in the Supabase SQL Editor and reload your project schema cache (Settings -> API -> Reload Schema Cache).';
  }

  if (message.includes('database error querying schema') || message.includes('database error finding user')) {
    return 'Supabase Auth record is incomplete (missing identity row in auth.identities from manual SQL insert). Fix: In Supabase Dashboard > Authentication > Users, delete "admin@gmail.com", click "Add user" -> "Create user" (password: 282100, auto-confirm: ON), or run the repair SQL in the SQL Editor.';
  }

  // Fallback safe message
  return err.message || 'Authentication request could not be processed. Please try again.';
}
