export const roleRouteMap = {
  admin: '/admin/dashboard',
  hod: '/hod/dashboard',
  faculty: '/faculty/dashboard',
  student: '/student/dashboard'
}

export function getDashboardPath(role) {
  return roleRouteMap[role] || '/login'
}