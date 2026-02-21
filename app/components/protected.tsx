"use client";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { checkDomain } from "@/app/actions";
import { Loader } from "@/app/components/loader";

export type ProtectedProps = {
  fallbackUrl: string;
  signUpRedirect: string;
  signInRedirectUrl: string;
  redirectUrl: string | null;
  productId: string | null;
};

export function Protected({
  children,
}: Readonly<{
  children: (props: ProtectedProps) => React.ReactNode;
}>) {
  const searchParams = useSearchParams();
  const paramRedirectUrl = searchParams.get("redirect_url");
  const paramProductId = searchParams.get("product_id");

  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);

  const [status, setStatus] = useState<"loading" | "success" | "denied">(
    "loading",
  );

  useEffect(() => {
    const initialize = async () => {
      let currentRedirectUrl = paramRedirectUrl;
      let currentProductId = paramProductId;

      if (currentRedirectUrl) {
        sessionStorage.setItem("redirect_url", currentRedirectUrl);
      } else {
        currentRedirectUrl = sessionStorage.getItem("redirect_url");
      }

      if (currentProductId) {
        sessionStorage.setItem("product_id", currentProductId);
      } else {
        currentProductId = sessionStorage.getItem("product_id");
      }

      setRedirectUrl(currentRedirectUrl);
      setProductId(currentProductId);

      if (!currentRedirectUrl || !currentProductId) {
        setStatus("denied");
        return;
      }

      const isValid = await checkDomain(currentRedirectUrl);
      if (isValid) {
        setStatus("success");
      } else {
        setStatus("denied");
      }
    };

    initialize();
  }, [paramRedirectUrl, paramProductId]);

  if (status === "loading") {
    return <Loader />;
  }

  if (status === "denied") {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
        <p className="text-gray-600">
          A valid authorized origin is required to access this page.
        </p>
      </div>
    );
  }

  const encodedUrl = encodeURIComponent(redirectUrl || "");
  const fallbackUrl = `/sso-callback?redirect_url=${encodedUrl}&product_id=${productId}`;
  const signUpRedirect = `/sign-up?redirect_url=${encodedUrl}&product_id=${productId}`;
  const signInRedirectUrl = `/sign-in?redirect_url=${encodedUrl}&product_id=${productId}`;

  return children({
    fallbackUrl,
    signUpRedirect,
    signInRedirectUrl,
    redirectUrl,
    productId,
  });
}
