import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';

// ðŸ§¯ TEMP DEBUG â€” global crash logger
const logErr = (...args) => {
  try {
  } catch {}
};

if (global && global.ErrorUtils) {
  const prevHandler = global.ErrorUtils.getGlobalHandler?.();
  global.ErrorUtils.setGlobalHandler((err, isFatal) => {
    logErr("Unhandled error:", err?.message);
    logErr("Name:", err?.name);
    logErr("Stack:", err?.stack);
    logErr("Fatal:", isFatal);
    if (prevHandler) prevHandler(err, isFatal);
  });
}

export default function App() {
  return <AppNavigator />;
}
