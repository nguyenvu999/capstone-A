import { useState } from "react";
import Logo from "../../../shared/ui/Logo";
import MicrosoftSignInButton from "../components/MicrosoftSignInButton";
import { getMicrosoftSSOStartUrl } from "../api/authApi";

function LoginPage() {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleMicrosoftSignIn = () => {
    setIsRedirecting(true);
    // Chỉ khi bấm nút mới nhảy sang Backend
    window.location.href = getMicrosoftSSOStartUrl();
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-[#94AB71] px-4'>
      <div className="w-full max-w-[420px] rounded-[22px] bg-white px-10 py-10 shadow-2xl">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold">Sign in to NetSuggest</h1>
          <p className="mb-8 text-sm text-[#5f6a60]">Use your Microsoft account</p>
          
          <MicrosoftSignInButton
            onClick={handleMicrosoftSignIn}
            isLoading={isRedirecting}
          />
          
          <p className="mt-6 text-xs text-[#6b746c]">
            Only authorized company users can access this platform.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;