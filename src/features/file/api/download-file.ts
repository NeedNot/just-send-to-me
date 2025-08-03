const BUCKET_URL = `https://pub-e663dd0a82424f67b9873b218d5d324c.r2.dev`;

export const getFileUrl = (key: string) => BUCKET_URL + '/' + key;
