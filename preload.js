// Setup global for navigator before any modules load
if (typeof navigator === 'undefined') {
  globalThis.navigator = {
    platform: process.platform === 'win32' ? 'Win32' : 'Linux',
  };
}

if (typeof window === 'undefined') {
  globalThis.window = globalThis;
}
