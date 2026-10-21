import { baseApi } from '../../../stores/baseApi';
import { ITenant, IRoommate, IEmergencyContact } from '../../../types';
import { adaptTenant } from '../../../utils/adapters';

export const tenantApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTenants: builder.query<ITenant[], { search?: string; isBadDebt?: boolean } | void>({
      query: () => '/tenants',
      transformResponse: (res: any[], _meta, arg) => {
        let list = (res || []).map(adaptTenant);
        if (arg && 'search' in arg && arg.search) {
          const s = arg.search.toLowerCase();
          list = list.filter(
            (t) =>
              t.fullName.toLowerCase().includes(s) ||
              t.citizenId.includes(s) ||
              t.phone.includes(s) ||
              t.currentRoomNumber?.toLowerCase().includes(s)
          );
        }
        if (arg && 'isBadDebt' in arg && arg.isBadDebt !== undefined) {
          list = list.filter((t) => t.isBadDebt === arg.isBadDebt);
        }
        return list;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Tenant' as const, id })),
              { type: 'Tenant', id: 'LIST' },
            ]
          : [{ type: 'Tenant', id: 'LIST' }],
    }),

    getMyTenantProfile: builder.query<ITenant, void>({
      query: () => '/tenants/me',
      transformResponse: (res: any) => adaptTenant(res),
      providesTags: ['Tenant'],
    }),

    getTenantById: builder.query<ITenant, number>({
      query: (id) => `/tenants/${id}`,
      transformResponse: (res: any) => adaptTenant(res),
      providesTags: (_result, _error, id) => [{ type: 'Tenant', id }],
    }),

    getTenantSummary: builder.query<any, number>({
      query: (id) => `/tenants/${id}/summary`,
      providesTags: (_result, _error, id) => [{ type: 'Tenant', id }],
    }),

    createTenant: builder.mutation<ITenant, Partial<ITenant>>({
      query: (payload) => ({
        url: '/tenants',
        method: 'POST',
        body: {
          full_name: payload.fullName,
          citizen_id: payload.citizenId,
          phone: payload.phone,
          email: payload.email,
          hometown: payload.hometown || 'Việt Nam',
        },
      }),
      transformResponse: (res: any) => adaptTenant(res),
      invalidatesTags: [{ type: 'Tenant', id: 'LIST' }],
    }),

    updateTenant: builder.mutation<ITenant, { id: number; data: Partial<ITenant> }>({
      query: ({ id, data }) => ({
        url: `/tenants/${id}`,
        method: 'PUT',
        body: {
          full_name: data.fullName,
          citizen_id: data.citizenId,
          phone: data.phone,
          email: data.email,
          hometown: data.hometown,
          is_bad_debt: data.isBadDebt,
        },
      }),
      transformResponse: (res: any) => adaptTenant(res),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Tenant', id },
        { type: 'Tenant', id: 'LIST' },
      ],
    }),

    addRoommate: builder.mutation<
      any,
      { tenantId: number; apartmentId?: number; roommate: Omit<IRoommate, 'id' | 'tenantId'> }
    >({
      query: ({ tenantId, apartmentId, roommate }) => ({
        url: '/roommates',
        method: 'POST',
        body: {
          tenant_id: tenantId,
          apartment_id: apartmentId || (roommate as any).apartmentId || 1,
          full_name: roommate.fullName,
          citizen_id: roommate.citizenId,
          phone: roommate.phone,
          relationship: roommate.relationship,
        },
      }),
      invalidatesTags: (_result, _error, { tenantId }) => [
        { type: 'Tenant', id: tenantId },
        { type: 'Tenant', id: 'LIST' },
      ],
    }),

    addEmergencyContact: builder.mutation<
      any,
      { tenantId: number; contact: Omit<IEmergencyContact, 'id' | 'tenantId'> }
    >({
      query: ({ tenantId, contact }) => ({
        url: '/emergency-contacts',
        method: 'POST',
        body: {
          tenant_id: tenantId,
          full_name: contact.fullName,
          phone: contact.phone,
          relationship: contact.relationship,
        },
      }),
      invalidatesTags: (_result, _error, { tenantId }) => [
        { type: 'Tenant', id: tenantId },
        { type: 'Tenant', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetTenantsQuery,
  useGetMyTenantProfileQuery,
  useGetTenantByIdQuery,
  useGetTenantSummaryQuery,
  useCreateTenantMutation,
  useUpdateTenantMutation,
  useAddRoommateMutation,
  useAddEmergencyContactMutation,
} = tenantApi;
