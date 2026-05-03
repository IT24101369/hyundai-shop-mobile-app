import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Auth Screens
import LoginScreen from './screens/Auth/LoginScreen';
import RegisterScreen from './screens/Auth/RegisterScreen';

// Dashboard Screens
import CustomerDashboard from './screens/Customer/CustomerDashboard';
import AdminDashboard from './screens/Admin/AdminDashboard';
import RiderDashboard from './screens/Rider/RiderDashboard';
import InventoryScreen from './screens/Admin/InventoryScreen';
import UserManagementScreen from './screens/Admin/UserManagementScreen';
import AdminCartScreen from './screens/Admin/AdminCartScreen';
import AdminOrdersScreen from './screens/Admin/AdminOrdersScreen';
import AdminComplaintsScreen from './screens/Admin/AdminComplaintsScreen';
import CartScreen from './screens/Customer/CartScreen';
import AddComplaintScreen from './screens/Customer/AddComplaintScreen';
import CheckoutScreen from './screens/Customer/CheckoutScreen';
import InvoiceScreen from './screens/Customer/InvoiceScreen';
import PromotionManagementScreen from './screens/Admin/PromotionManagementScreen';
import RiderOrdersScreen from './screens/Rider/RiderOrdersScreen';
import RiderLiveTrackingScreen from './screens/Rider/RiderLiveTrackingScreen';
import RiderCompletedOrdersScreen from './screens/Rider/RiderCompletedOrdersScreen';
import RiderProfileScreen from './screens/Rider/RiderProfileScreen';
import CustomerTrackingScreen from './screens/Customer/CustomerTrackingScreen';
import AdminPaymentsScreen from './screens/Admin/AdminPaymentsScreen';
import CustomerPaymentsScreen from './screens/Customer/CustomerPaymentsScreen';
import CustomerProfileScreen from './screens/Customer/CustomerProfileScreen';


// Context
import { AuthProvider } from './context/AuthContext';

const Stack = createStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={{ headerShown: false }}
        >
          {/* Auth Screens */}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ headerShown: true, title: 'Create Account', headerStyle: { backgroundColor: '#0f2747' }, headerTintColor: '#fff' }}
          />

          {/* Role-based Dashboards */}
          <Stack.Screen name="CustomerDashboard" component={CustomerDashboard} />
          <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
          <Stack.Screen name="RiderDashboard" component={RiderDashboard} />
          <Stack.Screen name="InventoryScreen" component={InventoryScreen} />
          <Stack.Screen name="UserManagementScreen" component={UserManagementScreen} />
          <Stack.Screen name="AdminCartScreen" component={AdminCartScreen} />
          <Stack.Screen name="AdminOrdersScreen" component={AdminOrdersScreen} />
          <Stack.Screen name="AdminComplaintsScreen" component={AdminComplaintsScreen} />
          <Stack.Screen name="CartScreen" component={CartScreen} />
          <Stack.Screen name="AddComplaintScreen" component={AddComplaintScreen} />
          <Stack.Screen name="CheckoutScreen" component={CheckoutScreen} />
          <Stack.Screen name="InvoiceScreen" component={InvoiceScreen} />
          <Stack.Screen name="PromotionManagementScreen" component={PromotionManagementScreen} />
          <Stack.Screen name="RiderOrdersScreen" component={RiderOrdersScreen} />
          <Stack.Screen name="RiderLiveTrackingScreen" component={RiderLiveTrackingScreen} />
          <Stack.Screen name="RiderCompletedOrders" component={RiderCompletedOrdersScreen} />
          <Stack.Screen name="RiderProfileScreen" component={RiderProfileScreen} />
          <Stack.Screen name="CustomerTrackingScreen" component={CustomerTrackingScreen} />
          <Stack.Screen name="AdminPaymentsScreen" component={AdminPaymentsScreen} />
          <Stack.Screen name="CustomerPaymentsScreen" component={CustomerPaymentsScreen} />
          <Stack.Screen name="CustomerProfileScreen" component={CustomerProfileScreen} />

        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
