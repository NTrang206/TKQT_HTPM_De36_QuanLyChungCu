import { useAppSelector, useAppDispatch } from './useRedux';
import { setCredentials, switchRole, logout } from '../stores/authSlice';
import { useLoginMutation, useLogoutBackendMutation } from '../stores/authApi';
import { UserRole } from '../types';

const ROLE_DEMO_CREDENTIALS: Record<Exclude<UserRole, 'GUEST'>, { username: string; password: string }> = {
  ADMIN: { username: 'admin@dwell.vn', password: 'admin123' },
  STAFF: { username: 'staff@dwell.vn', password: 'staff123' },
  ACCOUNTANT: { username: 'accountant@dwell.vn', password: 'acc123' },
  TENANT: { username: 'tenant@dwell.vn', password: 'tenant123' },
};

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, activeRole, token } = useAppSelector((state) => state.auth);
  const [loginMutation, { isLoading: isLoggingIn }] = useLoginMutation();
  const [logoutBackend] = useLogoutBackendMutation();

  const isAdmin = activeRole === 'ADMIN';
  const isStaff = activeRole === 'STAFF';
  const isAccountant = activeRole === 'ACCOUNTANT';
  const isTenant = activeRole === 'TENANT';
  const isGuest = activeRole === 'GUEST';

  const isManagement = isAdmin || isStaff || isAccountant;

  const handleLogin = async (username: string, password: string) => {
    const res = await loginMutation({ username, password }).unwrap();
    dispatch(setCredentials({ user: res.user, token: res.access_token }));
    return res;
  };

  const handleRoleSwitch = async (role: UserRole) => {
    dispatch(switchRole(role));
    if (role !== 'GUEST') {
      const creds = ROLE_DEMO_CREDENTIALS[role];
      try {
        const res = await loginMutation(creds).unwrap();
        dispatch(setCredentials({ user: res.user, token: res.access_token }));
      } catch {
        // Fallback already set by switchRole
      }
    }
  };

  const handleLogout = () => {
    logoutBackend().catch(() => {});
    dispatch(logout());
  };

  return {
    user,
    token,
    isAuthenticated,
    isInitialized: true,
    isLoggingIn,
    activeRole,
    isAdmin,
    isStaff,
    isAccountant,
    isTenant,
    isGuest,
    isManagement,
    login: handleLogin,
    switchRole: handleRoleSwitch,
    logout: handleLogout,
  };
};
