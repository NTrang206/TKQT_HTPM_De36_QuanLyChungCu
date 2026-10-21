import { baseApi } from './baseApi';
import { IUser } from '../types';
import { adaptUser } from '../utils/adapters';

export interface ILoginRequest {
  username: string;
  password: string;
}

export interface ILoginResponse {
  access_token: string;
  token_type: string;
  user: IUser;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<ILoginResponse, ILoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: (response: any) => ({
        access_token: response.access_token,
        token_type: response.token_type,
        user: adaptUser(response.user),
      }),
      invalidatesTags: ['Auth', 'User'],
    }),

    getMe: builder.query<IUser, void>({
      query: () => '/auth/me',
      transformResponse: (response: any) => adaptUser(response),
      providesTags: ['User'],
    }),

    registerTenant: builder.mutation<any, any>({
      query: (data) => ({
        url: '/auth/register-tenant',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Tenant', 'User'],
    }),

    changePassword: builder.mutation<any, any>({
      query: (data) => ({
        url: '/auth/change-password',
        method: 'PATCH',
        body: data,
      }),
    }),

    logoutBackend: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Auth', 'User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useGetMeQuery,
  useRegisterTenantMutation,
  useChangePasswordMutation,
  useLogoutBackendMutation,
} = authApi;
