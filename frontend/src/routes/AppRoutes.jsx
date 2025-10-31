import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute'
import StudentDashboard from '../pages/Student/Dashboard'
import ApplicationForm from '../pages/Student/ApplicationForm'
import ApplicationStatus from '../pages/Student/ApplicationStatus'
import StudentProject from '../pages/Student/Project'

import Login from '../components/login'
import Register from '../components/Register'
import AdminRegisterUser from '../components/AdminRegisterUser'
import ChangePassword from '../components/ChangePassword'

import RoleRedirect from './RoleRedirect'
import { getDashboardPath } from './paths'

import AdminDashboard from '../pages/Admin/Dashboard'
import HODDashboard from '../pages/HOD/Dashboard'
import HODApplicationView from '../pages/HOD/ApplicationView'
import FacultyDashboard, { FacultyAssignments, FacultyAssignmentDetails } from '../pages/Faculty/Dashboard'
import HODAssignments from '../pages/HOD/Assignments' // uncomment this

export default function AppRoutes() {
  return (
    <Routes>
      {/* Landing -> role-based dashboard or login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Admin tools */}
      <Route
        path="/admin/create-user"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminRegisterUser />
          </ProtectedRoute>
        }
      />

      {/* Dashboards */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute roles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hod/dashboard"
        element={
          <ProtectedRoute roles={['hod']}>
            <HODDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hod/applications/:id"
        element={
          <ProtectedRoute roles={['hod']}>
            <HODApplicationView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty"
        element={
          <ProtectedRoute roles={['faculty']}>
            <FacultyDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/dashboard"
        element={
          <ProtectedRoute roles={['faculty']}>
            <FacultyDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/assignments"
        element={
          <ProtectedRoute roles={['faculty']}>
            <FacultyAssignments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/assignments/:id"
        element={
          <ProtectedRoute roles={['faculty']}>
            <FacultyAssignmentDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute roles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/apply"
        element={
          <ProtectedRoute roles={['student']}>
            <ApplicationForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/status"
        element={
          <ProtectedRoute roles={['student']}>
            <ApplicationStatus />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/project"
        element={
          <ProtectedRoute roles={['student']}>
            <StudentProject />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hod/assignments"
        element={
          <ProtectedRoute roles={['hod']}>
            <HODAssignments />
          </ProtectedRoute>
        }
      />

      {/* Role-based redirect utility */}
      <Route path="/me" element={<RoleRedirect />} />

      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePassword />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}