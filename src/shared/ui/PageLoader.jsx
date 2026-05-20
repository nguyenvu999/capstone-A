function PageLoader({ text = "Loading..." }) {
  return (
    <div className='min-h-screen flex items-center justify-center bg-[#94AB71] [font-family:"Nunito_Sans",sans-serif] px-4'>
      <div className="w-full max-w-[420px] rounded-[22px] bg-white px-8 py-10 text-center shadow-2xl">
        <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-[#dce8c8] border-t-[#355e1d]" />
        <p className="text-[15px] font-medium text-[#355e1d]">{text}</p>
      </div>
    </div>
  )
}

export default PageLoader