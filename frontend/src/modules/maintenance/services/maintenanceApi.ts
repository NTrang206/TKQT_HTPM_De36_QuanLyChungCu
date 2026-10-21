import { baseApi } from '../../../stores/baseApi';
import { IMaintenanceRequest, MaintenancePriority, MaintenanceStatus } from '../../../types';
import { adaptMaintenance } from '../../../utils/adapters';

export const maintenanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMaintenanceRequests: builder.query<
      IMaintenanceRequest[],
      { status?: MaintenanceStatus; priority?: MaintenancePriority; apartmentId?: number; tenantId?: number } | void
    >({
      query: (params) => {
        const queryParams: Record<string, any> = {};
        if (params && 'status' in params && params.status) queryParams.status = params.status;
        if (params && 'priority' in params && params.priority) queryParams.priority = params.priority;
        return {
          url: '/maintenance-requests',
          params: queryParams,
        };
      },
      transformResponse: (res: any[], _meta, arg) => {
        let list = (res || []).map(adaptMaintenance);
        if (arg && 'apartmentId' in arg && arg.apartmentId) {
          list = list.filter((m) => m.apartmentId === Number(arg.apartmentId));
        }
        if (arg && 'tenantId' in arg && arg.tenantId) {
          list = list.filter((m) => m.tenantId === Number(arg.tenantId));
        }
        return list;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Maintenance' as const, id })),
              { type: 'Maintenance', id: 'LIST' },
            ]
          : [{ type: 'Maintenance', id: 'LIST' }],
    }),

    getMyMaintenanceRequests: builder.query<IMaintenanceRequest[], void>({
      query: () => '/maintenance-requests/my',
      transformResponse: (res: any[]) => (res || []).map(adaptMaintenance),
      providesTags: ['Maintenance'],
    }),

    getMaintenanceRequestById: builder.query<IMaintenanceRequest, number>({
      query: (id) => `/maintenance-requests/${id}`,
      transformResponse: (res: any) => adaptMaintenance(res),
      providesTags: (_res, _err, id) => [{ type: 'Maintenance', id }],
    }),

    createMaintenanceRequest: builder.mutation<IMaintenanceRequest, Partial<IMaintenanceRequest>>({
      query: (payload) => ({
        url: '/maintenance-requests',
        method: 'POST',
        body: {
          apartment_id: payload.apartmentId,
          reporter_name: payload.reporterName,
          phone: payload.phone,
          issue_description: payload.issueDescription,
          priority: payload.priority || 'MEDIUM',
          image_url: payload.imageUrl,
          tenant_id: payload.tenantId,
        },
      }),
      transformResponse: (res: any) => adaptMaintenance(res),
      invalidatesTags: [
        { type: 'Maintenance', id: 'LIST' },
        { type: 'Apartment', id: 'LIST' },
        { type: 'Dashboard', id: 'STATS' },
      ],
    }),

    createMyMaintenanceRequest: builder.mutation<IMaintenanceRequest, any>({
      query: (payload) => ({
        url: '/maintenance-requests/my',
        method: 'POST',
        body: {
          apartment_id: payload.apartmentId,
          issue_description: payload.issueDescription,
          priority: payload.priority || 'MEDIUM',
          image_url: payload.imageUrl,
        },
      }),
      transformResponse: (res: any) => adaptMaintenance(res),
      invalidatesTags: [
        { type: 'Maintenance', id: 'LIST' },
        { type: 'Dashboard', id: 'STATS' },
      ],
    }),

    assignTechnician: builder.mutation<
      IMaintenanceRequest,
      { ticketId: number; assignedStaffId?: number; technicianName?: string; technicianPhone?: string }
    >({
      query: ({ ticketId, assignedStaffId }) => ({
        url: `/maintenance-requests/${ticketId}/assign`,
        method: 'PATCH',
        body: {
          assigned_staff_id: assignedStaffId || 2,
        },
      }),
      transformResponse: (res: any) => adaptMaintenance(res),
      invalidatesTags: [{ type: 'Maintenance', id: 'LIST' }],
    }),

    completeAndInspectMaintenance: builder.mutation<
      IMaintenanceRequest,
      { ticketId: number; cost: number; rating?: number; feedback?: string; isPass?: boolean }
    >({
      query: ({ ticketId, cost }) => ({
        url: `/maintenance-requests/${ticketId}/complete`,
        method: 'PATCH',
        body: {
          repair_cost: cost,
        },
      }),
      transformResponse: (res: any) => adaptMaintenance(res),
      invalidatesTags: [
        { type: 'Maintenance', id: 'LIST' },
        { type: 'Apartment', id: 'LIST' },
        { type: 'Dashboard', id: 'STATS' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetMaintenanceRequestsQuery,
  useGetMyMaintenanceRequestsQuery,
  useGetMaintenanceRequestByIdQuery,
  useCreateMaintenanceRequestMutation,
  useCreateMyMaintenanceRequestMutation,
  useAssignTechnicianMutation,
  useCompleteAndInspectMaintenanceMutation,
} = maintenanceApi;
