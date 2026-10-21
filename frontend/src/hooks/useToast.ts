import { useAppDispatch } from './useRedux';
import { addNotification } from '../stores/globalSlice';

export const useToast = () => {
  const dispatch = useAppDispatch();

  const showSuccessToast = (message: string, title: string = 'Thành công') => {
    dispatch(addNotification({ type: 'success', title, message }));
  };

  const showErrorToast = (message: string, title: string = 'Lỗi') => {
    dispatch(addNotification({ type: 'error', title, message }));
  };

  const showInfoToast = (message: string, title: string = 'Thông báo') => {
    dispatch(addNotification({ type: 'info', title, message }));
  };

  const showWarningToast = (message: string, title: string = 'Cảnh báo') => {
    dispatch(addNotification({ type: 'warning', title, message }));
  };

  const success = (title: string, message: string = '') => {
    dispatch(addNotification({ type: 'success', title, message: message || title }));
  };

  const error = (title: string, message: string = '') => {
    dispatch(addNotification({ type: 'error', title, message: message || title }));
  };

  const info = (title: string, message: string = '') => {
    dispatch(addNotification({ type: 'info', title, message: message || title }));
  };

  const warning = (title: string, message: string = '') => {
    dispatch(addNotification({ type: 'warning', title, message: message || title }));
  };

  return { 
    showSuccessToast, 
    showErrorToast, 
    showInfoToast, 
    showWarningToast,
    success, 
    error, 
    info, 
    warning 
  };
};
