import { oauthProviders } from '@/lib/auth/options';
import { SignInForm } from '@/components/auth/SignInForm';

export default function SignInPage() {
  const providers = oauthProviders().map((provider) => ({
    id: provider.id,
    name: provider.name || provider.id,
  }));

  return <SignInForm oauthProviders={providers} />;
}
