import { redirect } from "next/navigation";

export default function AdminRootPage({
  params,
}: {
  params: { secret: string };
}) {
  const secret = params.secret;
  // Keep insecure path from redirecting to login. In practice, we check secret in login page route.
  return redirect(`/admin/${secret}/login`);
}
