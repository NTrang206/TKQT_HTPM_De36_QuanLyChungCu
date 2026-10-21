import { baseApi } from '../../../stores/baseApi';
import { IReceivable, IPayment, IDebtLedger, PaymentMethod } from '../../../types';
import { adaptReceivable, adaptPayment, adaptDebtLedger } from '../../../utils/adapters';

export const financeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReceivables: builder.query<IReceivable[], { month?: number; year?: number; status?: string; tenantId?: number } | void>({
      query: (params) => {
        const queryParams: Record<string, any> = {};
        if (params && 'status' in params && params.status) queryParams.status = params.status;
        return {
          url: '/receivables',
          params: queryParams,
        };
      },
      transformResponse: (res: any[], _meta, arg) => {
        let list = (res || []).map(adaptReceivable);
        if (arg && 'month' in arg && arg.month) list = list.filter((r) => r.billingMonth === Number(arg.month));
        if (arg && 'year' in arg && arg.year) list = list.filter((r) => r.billingYear === Number(arg.year));
        if (arg && 'tenantId' in arg && arg.tenantId) list = list.filter((r) => r.tenantId === Number(arg.tenantId));
        return list;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Receivable' as const, id })),
              { type: 'Receivable', id: 'LIST' },
            ]
          : [{ type: 'Receivable', id: 'LIST' }],
    }),

    getMyReceivables: builder.query<IReceivable[], void>({
      query: () => '/receivables/my',
      transformResponse: (res: any[]) => (res || []).map(adaptReceivable),
      providesTags: ['Receivable'],
    }),

    getReceivableById: builder.query<IReceivable, number>({
      query: (id) => `/receivables/${id}`,
      transformResponse: (res: any) => adaptReceivable(res),
      providesTags: (_res, _err, id) => [{ type: 'Receivable', id }],
    }),

    getVietQR: builder.query<{ qr_quick_url: string; qr_data_text: string }, number>({
      query: (receivableId) => `/receivables/${receivableId}/vietqr`,
    }),

    getPayments: builder.query<IPayment[], { receivableId?: number; contractId?: number } | void>({
      query: () => '/payments',
      transformResponse: (res: any[], _meta, arg) => {
        let list = (res || []).map(adaptPayment);
        if (arg && 'receivableId' in arg && arg.receivableId) {
          list = list.filter((p) => p.receivableId === Number(arg.receivableId));
        }
        if (arg && 'contractId' in arg && arg.contractId) {
          list = list.filter((p) => p.contractId === Number(arg.contractId));
        }
        return list;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Payment' as const, id })),
              { type: 'Payment', id: 'LIST' },
            ]
          : [{ type: 'Payment', id: 'LIST' }],
    }),

    getMyPayments: builder.query<IPayment[], void>({
      query: () => '/payments/my',
      transformResponse: (res: any[]) => (res || []).map(adaptPayment),
      providesTags: ['Payment'],
    }),

    getDebtLedgers: builder.query<IDebtLedger[], void>({
      query: () => '/debt-ledgers',
      transformResponse: (res: any[]) => (res || []).map(adaptDebtLedger),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'DebtLedger' as const, id })),
              { type: 'DebtLedger', id: 'LIST' },
            ]
          : [{ type: 'DebtLedger', id: 'LIST' }],
    }),

    getMyDebt: builder.query<IDebtLedger, void>({
      query: () => '/debt-ledgers/my',
      transformResponse: (res: any) => adaptDebtLedger(res),
      providesTags: ['DebtLedger'],
    }),

    recordPayment: builder.mutation<
      { payment: IPayment; receivable: IReceivable },
      {
        receivableId: number;
        amount: number;
        paymentMethod: PaymentMethod;
        note?: string;
        transactionCode?: string;
      }
    >({
      query: ({ receivableId, amount, paymentMethod, note, transactionCode }) => ({
        url: '/payments',
        method: 'POST',
        body: {
          receivable_id: receivableId,
          amount,
          payment_method: paymentMethod,
          transaction_code: transactionCode || (paymentMethod === 'BANK_TRANSFER' ? `TX-${Date.now().toString().slice(-8)}` : undefined),
          note,
        },
      }),
      transformResponse: (res: any) => ({
        payment: adaptPayment(res),
        receivable: adaptReceivable(res.receivable || { id: res.receivable_id }),
      }),
      invalidatesTags: [
        { type: 'Receivable', id: 'LIST' },
        { type: 'Payment', id: 'LIST' },
        { type: 'DebtLedger', id: 'LIST' },
        { type: 'Dashboard', id: 'STATS' },
        { type: 'Alert', id: 'LIST' },
      ],
    }),

    generateMonthlyReceivables: builder.mutation<
      { count: number; totalAmount: number },
      { month: number; year: number; defaultServiceFee?: number }
    >({
      query: ({ month, year, defaultServiceFee }) => ({
        url: '/billing/generate-monthly',
        method: 'POST',
        body: {
          billing_month: month,
          billing_year: year,
          due_day: 10,
          default_service_fee: defaultServiceFee || 1500000,
        },
      }),
      transformResponse: (res: any) => ({
        count: res.generated_count || 0,
        totalAmount: Number(res.total_amount || 0),
      }),
      invalidatesTags: [
        { type: 'Receivable', id: 'LIST' },
        { type: 'DebtLedger', id: 'LIST' },
        { type: 'Dashboard', id: 'STATS' },
      ],
    }),

    checkOverdueReceivables: builder.mutation<any, void>({
      query: () => ({
        url: '/receivables/check-overdue',
        method: 'PATCH',
      }),
      invalidatesTags: ['Receivable', 'Alert', 'Dashboard'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetReceivablesQuery,
  useGetMyReceivablesQuery,
  useGetReceivableByIdQuery,
  useGetVietQRQuery,
  useGetPaymentsQuery,
  useGetMyPaymentsQuery,
  useGetDebtLedgersQuery,
  useGetMyDebtQuery,
  useRecordPaymentMutation,
  useGenerateMonthlyReceivablesMutation,
  useCheckOverdueReceivablesMutation,
} = financeApi;
