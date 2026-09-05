import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BottomNav from '../components/BottomNav';

import ExploreScreen from '../screens/explore/ExploreScreen';
import FiltersScreen from '../screens/explore/FiltersScreen';
import EstablishmentDetailScreen from '../screens/explore/EstablishmentDetailScreen';

import HistoryScreen from '../screens/history/HistoryScreen';

import CheckInScreen from '../screens/checkins/CheckInScreen';
import ConfirmCheckInScreen from '../screens/explore/ConfirmCheckInScreen';

import PlanScreen from '../screens/plan/PlanScreen';
import PlansScreen from '../screens/plan/PlansScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import PersonalDataScreen from '../screens/profile/conta/PersonalDataScreen';
import SecurityScreen from '../screens/profile/conta/SecurityScreen';
import ChangePasswordScreen from '../screens/profile/conta/ChangePasswordScreen';
import NotificationScreen from '../screens/profile/preferencias/NotificationScreen';
import LocationScreen from '../screens/profile/preferencias/LocationScreen';
import HelpScreen from '../screens/profile/suporte/HelpScreen';
import ContactScreen from '../screens/profile/suporte/ContactScreen';

const Tab = createBottomTabNavigator();
const ExploreStackNav = createNativeStackNavigator();
const CheckInStackNav = createNativeStackNavigator();
const PlanStackNav = createNativeStackNavigator();
const ProfileStackNav = createNativeStackNavigator();

function ExploreStack() {
  return (
    <ExploreStackNav.Navigator screenOptions={{ headerShown: false }}>
      <ExploreStackNav.Screen name="ExploreMain" component={ExploreScreen} />
      <ExploreStackNav.Screen name="EstablishmentDetail" component={EstablishmentDetailScreen} />
      <ExploreStackNav.Screen name="Filters" component={FiltersScreen} options={{ presentation: 'modal' }} />
      <ExploreStackNav.Screen name="CheckInScreen" component={CheckInScreen} />
      <ExploreStackNav.Screen name="ConfirmCheckIn" component={ConfirmCheckInScreen} />
    </ExploreStackNav.Navigator>
  );
}

function CheckInStack() {
  return (
    <CheckInStackNav.Navigator screenOptions={{ headerShown: false }}>
      <CheckInStackNav.Screen name="CheckInScreen" component={CheckInScreen} />
    </CheckInStackNav.Navigator>
  );
}

function PlanStack() {
  return (
    <PlanStackNav.Navigator screenOptions={{ headerShown: false }}>
      <PlanStackNav.Screen name="PlanMain" component={PlanScreen} />
      <PlanStackNav.Screen name="Plans" component={PlansScreen} />
    </PlanStackNav.Navigator>
  );
}

function ProfileStack() {
  return (
    <ProfileStackNav.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStackNav.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStackNav.Screen name="Plan" component={PlanStack} />
      <ProfileStackNav.Screen name="PersonalData" component={PersonalDataScreen} />
      <ProfileStackNav.Screen name="Security" component={SecurityScreen} />
      <ProfileStackNav.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <ProfileStackNav.Screen name="Notification" component={NotificationScreen} />
      <ProfileStackNav.Screen name="Location" component={LocationScreen} />
      <ProfileStackNav.Screen name="Help" component={HelpScreen} />
      <ProfileStackNav.Screen name="Contact" component={ContactScreen} />
    </ProfileStackNav.Navigator>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomNav {...props} />}
    >
      <Tab.Screen name="Explorar" component={ExploreStack} />
      {/*<Tab.Screen name="Historico" component={HistoryScreen} />*/}
      <Tab.Screen name="CheckIns" component={CheckInStack} />
      <Tab.Screen name="Planos" component={PlanStack} />
      <Tab.Screen name="Perfil" component={ProfileStack} />
    </Tab.Navigator>
  );
}
