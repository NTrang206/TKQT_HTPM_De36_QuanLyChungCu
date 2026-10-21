import { baseApi } from '../../../stores/baseApi';
import { IBooking, BookingStatus } from '../../../types';
import { adaptBooking } from '../../../utils/adapters';

export const bookingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBookings: builder.query<IBooking[], { status?: BookingStatus } | void>({
      query: () => '/bookings',
      transformResponse: (res: any[], _meta, arg) => {
        let list = (res || []).map(adaptBooking);
        if (arg && 'status' in arg && arg.status) {
          list = list.filter((b) => b.status === arg.status);
        }
        return list;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Booking' as const, id })),
              { type: 'Booking', id: 'LIST' },
            ]
          : [{ type: 'Booking', id: 'LIST' }],
    }),

    lookupBooking: builder.query<IBooking[], { code?: string; phone?: string }>({
      query: (params) => ({
        url: '/bookings/lookup',
        params,
      }),
      transformResponse: (res: any[]) => (res || []).map(adaptBooking),
    }),

    getBookingById: builder.query<IBooking, number>({
      query: (id) => `/bookings/${id}`,
      transformResponse: (res: any) => adaptBooking(res),
      providesTags: (_res, _err, id) => [{ type: 'Booking', id }],
    }),

    createBooking: builder.mutation<IBooking, Partial<IBooking>>({
      query: (payload) => ({
        url: '/bookings',
        method: 'POST',
        body: {
          customer_name: payload.customerName,
          customer_phone: payload.customerPhone,
          customer_email: payload.customerEmail,
          apartment_id: payload.apartmentId,
          check_in_date: payload.checkInDate,
          deposit_amount: payload.depositAmount,
          notes: payload.notes,
        },
      }),
      transformResponse: (res: any) => adaptBooking(res),
      invalidatesTags: [
        { type: 'Booking', id: 'LIST' },
        { type: 'Apartment', id: 'LIST' },
        { type: 'Dashboard', id: 'STATS' },
      ],
    }),

    updateBookingStatus: builder.mutation<IBooking, { id: number; status: BookingStatus }>({
      query: ({ id, status }) => {
        const action = status === 'CONFIRMED' ? 'confirm' : 'cancel';
        return {
          url: `/bookings/${id}/${action}`,
          method: 'PATCH',
        };
      },
      transformResponse: (res: any) => adaptBooking(res),
      invalidatesTags: [
        { type: 'Booking', id: 'LIST' },
        { type: 'Apartment', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetBookingsQuery,
  useLookupBookingQuery,
  useGetBookingByIdQuery,
  useCreateBookingMutation,
  useUpdateBookingStatusMutation,
} = bookingApi;
