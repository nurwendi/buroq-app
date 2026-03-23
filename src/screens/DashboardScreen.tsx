import React from 'react';
import { useAuth } from '../context/AuthContext';
import AdminDashboardView from './Dashboard/AdminDashboardView';
import SuperadminDashboardView from './Dashboard/SuperadminDashboardView';
import StaffDashboardView from './Dashboard/StaffDashboardView';
import CustomerDashboardView from './Dashboard/CustomerDashboardView';
import { View, ActivityIndicator } from 'react-native';

export default function DashboardScreen() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  // Switch based on role
  const role = user.role?.toLowerCase();

  return (
    <View style={{ flex: 1 }}>
      {role === 'superadmin' ? (
        <SuperadminDashboardView />
      ) : role === 'admin' ? (
        <AdminDashboardView />
      ) : (role === 'manager' || role === 'staff' || role === 'agent' || role === 'partner') ? (
        <StaffDashboardView />
      ) : (
        <CustomerDashboardView />
      )}
    </View>
  );
}
