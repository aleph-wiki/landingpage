/**
 * Check if Community Solid Server is running and accessible
 */
export async function checkCSSAvailable(url: string = 'http://localhost:3000'): Promise<boolean> {
  try {
    const response = await fetch(url);
    return response.ok || response.status === 401; // 401 is also acceptable (auth required)
  } catch {
    return false;
  }
}

export async function waitForCSS(
  url: string = 'http://localhost:3000',
  maxAttempts: number = 10,
  delayMs: number = 500
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    if (await checkCSSAvailable(url)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  throw new Error(
    `CSS server not available at ${url} after ${maxAttempts} attempts. ` +
    `Please start it with: cd ../app && bun run solid`
  );
}
