import { baseApi } from '../../../stores/baseApi';
import { ISystemAlert } from '../../../types';
import { adaptAlert } from '../../../utils/adapters';

export const alertApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSystemAlerts: builder.query<ISystemAlert[], { isSent?: boolean; priority?: string } | void>({
      query: () => '/alerts',
      transformResponse: (res: any[], _meta, arg) => {
        let list = (res || []).map(adaptAlert);
        if (arg && 'isSent' in arg && arg.isSent !== undefined) {
          list = list.filter((a) => a.isSent === arg.isSent);
        }
        if (arg && 'priority' in arg && arg.priority) {
          list = list.filter((a) => a.priority === arg.priority);
        }
        return list;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Alert' as const, id })),
              { type: 'Alert', id: 'LIST' },
            ]
          : [{ type: 'Alert', id: 'LIST' }],
    }),

    triggerSystemScan: builder.mutation<{ newAlertsCount: number; scannedItemsCount: number }, { daysToEnd?: number } | void>({
      query: (arg) => ({
        url: '/alerts/scan',
        method: 'POST',
        body: {
          days_to_end: arg?.daysToEnd || 30,
        },
      }),
      transformResponse: (res: any) => ({
        newAlertsCount: (res.expired_contracts_count || 0) + (res.overdue_receivables_count || 0),
        scannedItemsCount: res.total_new_alerts || 0,
      }),
      invalidatesTags: [{ type: 'Alert', id: 'LIST' }, { type: 'Dashboard', id: 'STATS' }],
    }),

    dispatchAlertChannels: builder.mutation<
      ISystemAlert,
      { alertId: number; channels: ('ZALO' | 'SMS' | 'EMAIL' | 'APP_PUSH')[]; editedBody?: string }
    >({
      query: ({ alertId, channels }) => {
        const primaryChannel = channels.includes('ZALO') ? 'ZALO' : channels.includes('SMS') ? 'SMS' : 'EMAIL';
        return {
          url: `/alerts/${alertId}/mark-sent`,
          method: 'PATCH',
          body: { channel: primaryChannel },
        };
      },
      transformResponse: (res: any) => adaptAlert(res),
      invalidatesTags: [{ type: 'Alert', id: 'LIST' }],
    }),

    generateAIDunning: builder.mutation<any, { alertId: number; receivableId?: number }>({
      query: ({ alertId }) => ({
        url: `/alerts/${alertId}/generate-dunning`,
        method: 'POST',
      }),
    }),

    regenerateAIDraft: builder.mutation<
      ISystemAlert,
      { alertId: number; promptOptions: any }
    >({
      query: ({ alertId }) => ({
        url: `/alerts/${alertId}/generate-dunning`,
        method: 'POST',
      }),
      transformResponse: (res: any, _meta, arg) => {
        const { alertId, promptOptions } = arg;
        let bodyText = res.message_body || '';
        if (promptOptions.tone === 'STRICT') {
          bodyText = `[ĐÔN ĐỐC NGHIÊM NGHỊ]\nKính gửi Quý cư dân ${res.recipient_name || promptOptions.customerName || 'khách thuê'},\n\nKhoản thanh toán căn hộ ${promptOptions.roomNumber || 'P101'} hiện đã quá hạn ${res.days_overdue || promptOptions.daysOverdue || 0} ngày với tổng số tiền ${Number(res.amount_due || promptOptions.amountDue || 0).toLocaleString()} VNĐ.\n\nĐề nghị Quý cư dân khẩn trương hoàn tất thanh toán trước 18:00 ngày mai để tránh phát sinh chế tài tạm ngưng cung cấp dịch vụ tiện ích theo quy định tại Hợp đồng thuê.\n\nTrân trọng!\nBan Quản Trị Tòa Nhà.`;
        } else if (promptOptions.tone === 'CONCISE_SMS') {
          bodyText = res.sms_body || `[Dwell] Nhac thanh toan phong ${promptOptions.roomNumber || 'P101'}: ${Number(res.amount_due || promptOptions.amountDue || 0).toLocaleString()}d. Qua han ${res.days_overdue || promptOptions.daysOverdue || 0} ngay. Vui long chuyen khoan qua VietQR. Hotline 19008899.`;
        } else if (!bodyText) {
          bodyText = `Kính gửi Anh/Chị ${res.recipient_name || promptOptions.customerName || 'Cư dân'},\n\nBan Quản Lý Tòa Nhà xin gửi lời chào trân trọng và thông báo kỳ thanh toán cước phí căn hộ ${promptOptions.roomNumber || 'P101'} số tiền ${Number(res.amount_due || promptOptions.amountDue || 0).toLocaleString()} VNĐ. Quý cư dân vui lòng kiểm tra và quét mã VietQR Napas247 đính kèm để gạch nợ tự động nhé.\n\nTrân trọng cảm ơn sự hợp tác của Quý cư dân!`;
        }

        return {
          id: alertId,
          alertCode: `ALT-${String(alertId).padStart(4, '0')}`,
          alertType: 'OVERDUE_DEBT',
          referenceId: res.receivable_id || alertId,
          referenceCode: `REF-${res.receivable_id || alertId}`,
          targetName: res.recipient_name || promptOptions.customerName || 'Cư dân',
          targetPhone: res.recipient_phone || '0912.888.999',
          roomNumber: promptOptions.roomNumber || 'P101',
          buildingName: promptOptions.buildingName || 'Sunshine Diamond Tower',
          amountDue: Number(res.amount_due) || promptOptions.amountDue || 0,
          daysOverdue: res.days_overdue || promptOptions.daysOverdue || 0,
          priority: 'HIGH',
          isSent: false,
          sentChannels: [],
          aiDraftContent: {
            scenario: promptOptions.scenario || 'OVERDUE_WITH_PENALTY',
            tone: promptOptions.tone || 'EMPATHETIC',
            subject: res.email_subject || `Thông báo thanh toán cước phí căn ${promptOptions.roomNumber || 'P101'}`,
            body: bodyText,
            generatedAt: new Date().toISOString(),
          },
          createdAt: new Date().toISOString(),
        };
      },
      invalidatesTags: [{ type: 'Alert', id: 'LIST' }],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetSystemAlertsQuery,
  useTriggerSystemScanMutation,
  useDispatchAlertChannelsMutation,
  useGenerateAIDunningMutation,
  useRegenerateAIDraftMutation,
} = alertApi;
