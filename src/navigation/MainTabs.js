
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import BottomNav from '../components/BottomNav';

import ExploreScreen from '../screens/explore/inicio/ExploreScreen';
import FiltersScreen from '../screens/explore/inicio/FiltersScreen';
import EstablishmentDetailScreen from '../screens/explore/detalhe/EstablishmentDetailScreen';

import EstabelecimentoOfertaDetailScreen from '../screens/explore/ofertadetalhe/OfertaDetailScreen';
import EstabelecimentoOfertaCheckoutScreen from '../screens/explore/ofertacheckout/OfertaCheckoutScreen';
import EstabelecimentoOfertaPagamentoResultadoScreen from '../screens/explore/ofertafeedback/OfertaPagamentoResultadoScreen';

import MeusAcessosScreen from '../screens/meusacessos/MeusAcessosScreen';
import ConfirmCheckInScreen from '../screens/explore/checkin/ConfirmCheckInScreen';
import CheckinSuccessScreen from '../screens/explore/checkin/CheckinSuccessScreen';
import CheckInPendingScreen from '../screens/explore/checkin/CheckInPendingScreen';

import PlanScreen from '../screens/plan/PlanScreen';
import ChangePlanScreen from '../screens/plan/ChangePlanScreen';
import ReviewPlanScreen from '../screens/plan/ReviewPlanScreen';
import PaymentDetail from '../screens/profile/pagamento/pagamento/PaymentDetail';
import PaymentScreen from '../screens/profile/pagamento/pagamento/PaymentScreen';

import ProfileScreen from '../screens/profile/ProfileScreen';
import PersonalDataScreen from '../screens/profile/conta/PersonalDataScreen';
import SecurityScreen from '../screens/profile/conta/SecurityScreen';
import ChangePasswordScreen from '../screens/profile/conta/ChangePasswordScreen';
import NotificationScreen from '../screens/profile/preferencias/NotificationScreen';
import LocationScreen from '../screens/profile/preferencias/LocationScreen';
import HelpScreen from '../screens/profile/suporte/HelpScreen';
import ContactScreen from '../screens/profile/suporte/ContactScreen';
import PaymentMethodScreen from '../screens/profile/pagamento/formapagamento/PaymentMethodScreen';
import RegisterCardScreen from '../screens/profile/pagamento/formapagamento/RegisterCardScreen';

const Tab = createBottomTabNavigator();

const ExploreStackNav = createNativeStackNavigator();
const MeusAcessosStackNav = createNativeStackNavigator();
const PlanStackNav = createNativeStackNavigator();
const ProfileStackNav = createNativeStackNavigator();

function ExploreStack() {
  return (
    <ExploreStackNav.Navigator
      screenOptions={{ headerShown: false }}
    >
      <ExploreStackNav.Screen
        name="ExplorarMain"
        component={ExploreScreen}
      />

      <ExploreStackNav.Screen
        name="EstablishmentDetail"
        component={EstablishmentDetailScreen}
      />

      <ExploreStackNav.Screen
        name="Filters"
        component={FiltersScreen}
        options={{ presentation: 'modal' }}
      />

      <ExploreStackNav.Screen
        name="ConfirmCheckIn"
        component={ConfirmCheckInScreen}
      />

      <ExploreStackNav.Screen
        name="CheckInSuccess"
        component={CheckinSuccessScreen}
      />

      <ExploreStackNav.Screen
        name="CheckInPending"
        component={CheckInPendingScreen}
      />

      <ExploreStackNav.Screen
        name="EstabelecimentoOfertaDetail"
        component={EstabelecimentoOfertaDetailScreen}
      />

      <ExploreStackNav.Screen
        name="EstabelecimentoOfertaCheckout"
        component={EstabelecimentoOfertaCheckoutScreen}
      />

      <ExploreStackNav.Screen
        name="EstabelecimentoOfertaPagamentoResultado"
        component={EstabelecimentoOfertaPagamentoResultadoScreen}
      />
      
    </ExploreStackNav.Navigator>
  );
}

function MeusAcessosStack() {
  return (
    <MeusAcessosStackNav.Navigator
      screenOptions={{ headerShown: false }}
    >
      <MeusAcessosStackNav.Screen
        name="MeusAcessos"
        component={MeusAcessosScreen}
      />
    </MeusAcessosStackNav.Navigator>
  );
}

function PlanStack() {
  return (
    <PlanStackNav.Navigator
      screenOptions={{ headerShown: false }}
    >
      <PlanStackNav.Screen
        name="PlanMain"
        component={PlanScreen}
      />

      <PlanStackNav.Screen
        name="ChangePlan"
        component={ChangePlanScreen}
      />

      <PlanStackNav.Screen
        name="ReviewPlan"
        component={ReviewPlanScreen}
      />

      <PlanStackNav.Screen
        name="PaymentDetail"
        component={PaymentDetail}
      />

      <PlanStackNav.Screen
        name="PaymentMethod"
        component={PaymentMethodScreen}
      />

      <PlanStackNav.Screen
        name="RegisterCard"
        component={RegisterCardScreen}
      />
    </PlanStackNav.Navigator>
  );
}

function ProfileStack() {
  return (
    <ProfileStackNav.Navigator
      screenOptions={{ headerShown: false }}
    >
      <ProfileStackNav.Screen
        name="ProfileMain"
        component={ProfileScreen}
      />

      <ProfileStackNav.Screen
        name="Plan"
        component={PlanStack}
      />

      <ProfileStackNav.Screen
        name="PersonalData"
        component={PersonalDataScreen}
      />

      <ProfileStackNav.Screen
        name="Security"
        component={SecurityScreen}
      />

      <ProfileStackNav.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
      />

      <ProfileStackNav.Screen
        name="Notification"
        component={NotificationScreen}
      />

      <ProfileStackNav.Screen
        name="Location"
        component={LocationScreen}
      />

      <ProfileStackNav.Screen
        name="Help"
        component={HelpScreen}
      />

      <ProfileStackNav.Screen
        name="Contact"
        component={ContactScreen}
      />

      <ProfileStackNav.Screen
        name="PaymentMethod"
        component={PaymentMethodScreen}
      />

      <ProfileStackNav.Screen
        name="RegisterCard"
        component={RegisterCardScreen}
      />

      <ProfileStackNav.Screen
        name="Payment"
        component={PaymentScreen}
      />

      <ProfileStackNav.Screen
        name="PaymentDetail"
        component={PaymentDetail}
      />
    </ProfileStackNav.Navigator>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomNav {...props} />}
    >
      <Tab.Screen
        name="Explorar"
        component={ExploreStack}
      />

      <Tab.Screen
        name="Meus Acessos"
        component={MeusAcessosStack}
      />

      <Tab.Screen
        name="Plano"
        component={PlanStack}
      />

      <Tab.Screen
        name="Perfil"
        component={ProfileStack}
      />
    </Tab.Navigator>
  );
}
