function getMyAccount() {}

export function useMyAccount() {
  return {
    name: 'Test',
    email: 'hello@justsendto.me',
    subscription: 'free',
    quota: {
      used: 1,
      max: 3,
    },
  };
}
