import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallback() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
