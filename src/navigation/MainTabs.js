import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BottomNav from '../components/BottomNav';

import ExploreScreen from '../screens/ExploreScreen';
import EstablishmentDetailScreen from '../screens/EstablishmentDetailScreen';
import FiltersScreen from '../screens/FiltersScreen';
import HistoryScreen from '../screens/HistoryScreen';
import CheckInScreen from '../screens/CheckInScreen';
import CheckInSuccessScreen from '../screens/CheckInSuccessScreen';
import PlanScreen from '../screens/PlanScreen';
import PlansScreen from '../screens/PlansScreen';
import ProfileScreen from '../screens/ProfileScreen';

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
      <ExploreStackNav.Screen name="CheckInSuccess" component={CheckInSuccessScreen} />
    </ExploreStackNav.Navigator>
  );
}

function CheckInStack() {
  return (
    <CheckInStackNav.Navigator screenOptions={{ headerShown: false }}>
      <CheckInStackNav.Screen name="CheckInScreen" component={CheckInScreen} />
      <CheckInStackNav.Screen name="CheckInSuccess" component={CheckInSuccessScreen} />
      <CheckInStackNav.Screen name="EstablishmentDetail" component={EstablishmentDetailScreen} />
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
      <Tab.Screen name="Historico" component={HistoryScreen} />
      <Tab.Screen name="CheckIn" component={CheckInStack} />
      <Tab.Screen name="Planos" component={PlanStack} />
      <Tab.Screen name="Perfil" component={ProfileStack} />
    </Tab.Navigator>
  );
}
