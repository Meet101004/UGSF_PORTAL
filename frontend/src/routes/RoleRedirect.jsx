import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRole } from '../store/authStore'
import { getDashboardPath } from './paths'

export default function RoleRedirect() {
  const navigate = useNavigate()
  useEffect(() => {
    const role = getRole()
    navigate(getDashboardPath(role), { replace: true })
  }, [navigate])
  return null
}