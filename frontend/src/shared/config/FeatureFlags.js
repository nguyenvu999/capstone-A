// ❌ SAI: "false" vẫn được coi là true trong JS
if (import.meta.env.VITE_ENABLE_EMAIL_PASSWORD_LOGIN) 

// ✅ ĐÚNG:
const isEmailPasswordEnabled = import.meta.env.VITE_ENABLE_EMAIL_PASSWORD_LOGIN === "true";