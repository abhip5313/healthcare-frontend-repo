import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import authService from '../services/authService';
import toast from 'react-hot-toast';

// ─── Context ──────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ─── Reducer ──────────────────────────────────────────────────────────────
const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

// ─── Token Helpers ────────────────────────────────────────────────────────
const isTokenExpired = (token) => {
  try {
    const decoded = jwtDecode(token);
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

// ─── Helper: extract tokens from API response ─────────────────────────────
// Backend login  → { success, access, refresh, user }
// Backend register → { success, tokens: { access, refresh }, user }
const extractTokens = (data) => {
  const access  = data.access  || data.tokens?.access;
  const refresh = data.refresh || data.tokens?.refresh;
  return { access, refresh };
};

// ─── Provider ─────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // On app load: restore session from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const accessToken  = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      const userJson     = localStorage.getItem('user');

      if (!accessToken || !refreshToken || !userJson) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      if (isTokenExpired(accessToken)) {
        try {
          const data = await authService.refreshToken(refreshToken);
          const newAccess = data.access;
          localStorage.setItem('access_token', newAccess);
          const user = JSON.parse(userJson);
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user, accessToken: newAccess, refreshToken },
          });
        } catch {
          localStorage.clear();
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        const user = JSON.parse(userJson);
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, accessToken, refreshToken },
        });
      }
    };

    initAuth();
  }, []);

  // ─── login ───────────────────────────────────────────────────────────
const login = useCallback(async (credentials) => {
  try {
    const data = await authService.login(credentials);
    const { access, refresh } = extractTokens(data);
    const user = data.user;

    if (!access || !refresh || !user) {
      throw new Error('Invalid response from server.');
    }

    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(user));

    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: {
        user,
        accessToken: access,
        refreshToken: refresh,
      },
    });

    toast.success(`Welcome back, ${user.full_name}!`);
    return data;

  } catch (err) {
    // Important: pass backend error to LoginPage
    throw err;
  }
}, []);

  // ─── register ─────────────────────────────────────────────────────────
  const register = useCallback(async (userData) => {
    const data = await authService.register(userData);
    const { access, refresh } = extractTokens(data);
    const user = data.user;

    if (!access || !refresh || !user) {
      throw new Error('Invalid response from server. Please try again.');
    }

    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(user));

    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: { user, accessToken: access, refreshToken: refresh },
    });

    toast.success('Account created successfully!');
    return data;
  }, []);

  // ─── logout ───────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch {
      // Always clear locally even if API fails
    } finally {
      localStorage.clear();
      dispatch({ type: 'LOGOUT' });
      toast.success('Logged out successfully.');
    }
  }, []);

  // ─── updateUser ───────────────────────────────────────────────────────
  const updateUser = useCallback((updatedFields) => {
    const current = JSON.parse(localStorage.getItem('user') || '{}');
    const updated = { ...current, ...updatedFields };
    localStorage.setItem('user', JSON.stringify(updated));
    dispatch({ type: 'UPDATE_USER', payload: updatedFields });
  }, []);

  const value = { ...state, login, register, logout, updateUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}

export default AuthContext;
