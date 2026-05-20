function MicrosoftSignInButton({ onClick, isLoading }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#355e1d] px-4 text-base font-medium text-white transition hover:bg-[#2d4f18] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isLoading ? (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Redirecting to Microsoft...
        </>
      ) : (
        <>
          <svg className="h-5 w-5" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="9" height="9" fill="white" />
            <rect x="13" y="1" width="9" height="9" fill="white" />
            <rect x="1" y="13" width="9" height="9" fill="white" />
            <rect x="13" y="13" width="9" height="9" fill="white" />
          </svg>
          Sign in with Microsoft
        </>
      )}
    </button>
  )
}

export default MicrosoftSignInButton