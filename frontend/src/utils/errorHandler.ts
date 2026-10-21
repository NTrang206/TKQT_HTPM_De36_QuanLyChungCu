/**
 * Centralized API & Form Error Handling Utility
 * Extracts human-readable Vietnamese error messages from FastAPI responses (400, 422, 500)
 * and maps field-specific validation errors for UI components.
 */

export interface FormErrorResult {
  message: string;
  fieldErrors: Record<string, string>;
}

export function parseApiError(err: any, defaultMessage: string = 'Đã có lỗi xảy ra khi lưu dữ liệu'): FormErrorResult {
  const fieldErrors: Record<string, string> = {};
  let mainMessage = defaultMessage;

  if (!err) {
    return { message: defaultMessage, fieldErrors };
  }

  const data = err.data || err.response?.data || err;

  // Case 1: FastAPI 422 Validation Error array
  if (data?.detail && Array.isArray(data.detail)) {
    const messages: string[] = [];
    for (const item of data.detail) {
      let cleanMsg = item.msg || 'Không hợp lệ';
      // Clean pydantic prefixes
      cleanMsg = cleanMsg.replace(/^Value error,\s*/i, '');
      messages.push(cleanMsg);

      if (Array.isArray(item.loc) && item.loc.length > 0) {
        // Last element in loc is usually the field name: ['body', 'citizen_id'] -> 'citizen_id'
        const fieldName = String(item.loc[item.loc.length - 1]);
        fieldErrors[fieldName] = cleanMsg;
      }
    }
    if (messages.length > 0) {
      mainMessage = messages.join('. ');
    }
    return { message: mainMessage, fieldErrors };
  }

  // Case 2: String detail (e.g. 400 Bad Request from FastAPI HTTPException)
  if (typeof data?.detail === 'string') {
    mainMessage = data.detail;
    return { message: mainMessage, fieldErrors };
  }

  // Case 3: Nested error object { error: { message: "..." } }
  if (data?.error?.message) {
    mainMessage = data.error.message;
    return { message: mainMessage, fieldErrors };
  }

  // Case 4: Standard JS / Axios error message
  if (typeof data?.message === 'string') {
    mainMessage = data.message;
    return { message: mainMessage, fieldErrors };
  }

  return { message: mainMessage, fieldErrors };
}
