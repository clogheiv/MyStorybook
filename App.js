import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';

// 🧯 TEMP DEBUG — global crash logger
const logErr = (...args) => {
  try {
    console.log("🧯GLOBAL_ERR:", ...args);
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
