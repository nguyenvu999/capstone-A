const REDIRECT_KEY = "redirectAfterLogin"

// Lưu page user định vào trước khi bị redirect sang login
export function saveRedirectAfterLogin(path) {
  sessionStorage.setItem(REDIRECT_KEY, path)
}

// Lấy rồi xóa path đã lưu
export function consumeRedirectAfterLogin() {
  const path = sessionStorage.getItem(REDIRECT_KEY)
  sessionStorage.removeItem(REDIRECT_KEY)
  return path
}

// Xóa path redirect nếu cần
export function clearRedirectAfterLogin() {
  sessionStorage.removeItem(REDIRECT_KEY)
}

// Lấy current full path
export function getCurrentFullPath() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}

// Điều hướng sau login:
// - Nếu target là /map thì replace luôn
// - Nếu target là page protected khác, ta đi qua /map trước
//   để khi user bấm Back, nó quay về /map thay vì /login
export function navigateAfterLogin(navigate, targetPath) {
  const target = targetPath || "/map"

  if (target === "/map") {
    navigate("/map", { replace: true })
    return
  }

  // Bước 1: replace login/callback bằng /map
  navigate("/map", { replace: true })

  // Bước 2: push page đích lên history
  setTimeout(() => {
    navigate(target)
  }, 0)
}