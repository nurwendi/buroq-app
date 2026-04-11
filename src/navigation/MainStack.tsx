import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import DashboardScreen from '../screens/DashboardScreen';
import CustomerListScreen from '../screens/CustomerListScreen';
import SettingsScreen from '../screens/SettingsScreen';
import BillingScreen from '../screens/BillingScreen';
import SystemUsersScreen from '../screens/SystemUsersScreen';
import CustomerDetailScreen from '../screens/CustomerDetailScreen';
import CustomerFormScreen from '../screens/CustomerFormScreen';
import PaymentFormScreen from '../screens/PaymentFormScreen';
import PaymentHistoryScreen from '../screens/PaymentHistoryScreen';
import NATScreen from '../screens/NATScreen';
import AllUsersScreen from '../screens/AllUsersScreen';
import FinancialReportScreen from '../screens/FinancialReportScreen';
import PaymentGatewaySettingsScreen from '../screens/PaymentGatewaySettingsScreen';
import UnpaidBillsScreen from '../screens/UnpaidBillsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SystemSettingsScreen from '../screens/SystemSettingsScreen';
import NasManagementScreen from '../screens/NasManagementScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import ServerSettingsScreen from '../screens/ServerSettingsScreen';
import AboutScreen from '../screens/AboutScreen';
import LogsScreen from '../screens/LogsScreen';
import PppoeProfilesScreen from '../screens/PppoeProfilesScreen';
import NotificationScreen from '../screens/NotificationScreen';
import BroadcastScreen from '../screens/BroadcastScreen';
import GenieAcsScreen from '../screens/GenieAcsScreen';
import SuperadminCustomerListScreen from '../screens/SuperadminCustomerListScreen';
import RegistrationReviewScreen from '../screens/RegistrationReviewScreen';
import ActiveConnectionsScreen from '../screens/ActiveConnectionsScreen';

const Stack = createStackNavigator();

export default function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Home" component={DashboardScreen} />
      <Stack.Screen name="CustomerList" component={CustomerListScreen} />
      <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
      <Stack.Screen name="CustomerForm" component={CustomerFormScreen} />
      <Stack.Screen name="BillingTab" component={BillingScreen} />
      <Stack.Screen name="SettingsTab" component={SettingsScreen} />
      <Stack.Screen name="SystemUsers" component={SystemUsersScreen} />
      <Stack.Screen name="AllUsers" component={AllUsersScreen} />
      <Stack.Screen name="NAT" component={NATScreen} />
      <Stack.Screen name="PaymentForm" component={PaymentFormScreen} />
      <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
      <Stack.Screen name="Logs" component={LogsScreen} />
      <Stack.Screen name="PppoeProfiles" component={PppoeProfilesScreen} />
      <Stack.Screen name="FinancialReport" component={FinancialReportScreen} />
      <Stack.Screen name="PaymentGatewaySettings" component={PaymentGatewaySettingsScreen} />
      <Stack.Screen name="UnpaidBills" component={UnpaidBillsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="SystemSettings" component={SystemSettingsScreen} />
      <Stack.Screen name="NasManagement" component={NasManagementScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="ServerSettings" component={ServerSettingsScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Notification" component={NotificationScreen} />
      <Stack.Screen name="Broadcast" component={BroadcastScreen} />
      <Stack.Screen name="GenieACS" component={GenieAcsScreen} />
      <Stack.Screen name="SuperadminCustomerList" component={SuperadminCustomerListScreen} />
      <Stack.Screen name="RegistrationReview" component={RegistrationReviewScreen} />
      <Stack.Screen name="ActiveConnections" component={ActiveConnectionsScreen} />
    </Stack.Navigator>
  );
}
