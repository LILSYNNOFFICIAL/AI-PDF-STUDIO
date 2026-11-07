export function isAllowedApiOrigin(
  origin: string,
  configuredOrigins: string,
  nodeEnv: string | undefined
): boolean {
  const allowedOrigins = new Set(
    configuredOrigins.split(',').map(value => value.trim()).filter(Boolean)
  );
  const localDevelopmentOrigin =
    nodeEnv !== 'production' &&
    /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

  return allowedOrigins.has(origin) || localDevelopmentOrigin;
}
