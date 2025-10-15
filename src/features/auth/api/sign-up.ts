import { authClient } from '@/lib/better-auth';
import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

export type EmailCredientals = {
  name: string;
  email: string;
  password: string;
};

async function signUp(credentials: EmailCredientals) {
  const { error, data } = await authClient.signUp.email({
    ...credentials,
  });
  if (error) {
    throw error;
  }
  return data;
}

async function sendOTPEmail(email: string) {
  const { error } = await authClient.emailOtp.sendVerificationOtp({
    email,
    type: 'email-verification',
  });
  if (error) {
    throw error;
  }
}

async function verifyOTP({
  email,
  otp,
  turnstileToken,
}: {
  email: string;
  otp: string;
  turnstileToken?: string;
}) {
  const { error } = await authClient.emailOtp.verifyEmail({
    email,
    otp,
    fetchOptions: turnstileToken
      ? {
          headers: {
            'x-captcha-response': turnstileToken,
          },
        }
      : undefined,
  });
  if (error) {
    throw error;
  }
}

export function useSignUp(
  mutationConfig: UseMutationOptions<
    Awaited<ReturnType<typeof signUp>>,
    Error,
    EmailCredientals
  > = {},
) {
  return useMutation<
    Awaited<ReturnType<typeof signUp>>,
    Error,
    EmailCredientals
  >({
    mutationFn: signUp,
    ...mutationConfig,
  });
}

export function useOTPVerification({
  onVerificationSuccess,
}: {
  onVerificationSuccess?: () => void;
}) {
  const sendOTP = useMutation({
    mutationFn: sendOTPEmail,
  });

  const checkOTP = useMutation({
    mutationFn: verifyOTP,
    onSuccess: onVerificationSuccess,
  });

  return {
    sendOTP: sendOTP.mutateAsync,
    verifyOTP: checkOTP.mutateAsync,

    isPending: sendOTP.isPending || checkOTP.isPending,
    error: sendOTP.error || checkOTP.error,
  };
}
