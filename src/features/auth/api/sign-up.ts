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

async function verifyOTP(credentials: { email: string; otp: string }) {
  const { error } = await authClient.emailOtp.verifyEmail(credentials);
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
    sendOTP: sendOTP.mutate,
    checkOTP: checkOTP.mutate,

    isPending: sendOTP.isPending || checkOTP.isPending,
    error: sendOTP.error || checkOTP.error,
  };
}
