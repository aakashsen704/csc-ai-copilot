import { useState, useCallback } from 'react';
import { validateAPI } from '../utils/api';
import { validateAadhaarOffline, validateIFSCOffline, validateMobileOffline, validateAgeOffline, validatePincodeOffline } from '../utils/validators';

export function useValidation(isOnline) {
  const [fieldStates, setFieldStates] = useState({});

  const setFieldState = useCallback((field, state) => {
    setFieldStates(prev => ({ ...prev, [field]: state }));
  }, []);

  const validate = useCallback(async (fieldName, value, extra = {}) => {
    if (!value || value.toString().trim() === '') {
      setFieldState(fieldName, { status: 'empty' });
      return null;
    }

    // Always try offline first for speed
    let offlineResult = null;
    if (fieldName === 'aadhaar') offlineResult = validateAadhaarOffline(value);
    else if (fieldName === 'ifscCode') offlineResult = validateIFSCOffline(value);
    else if (fieldName === 'mobile') offlineResult = validateMobileOffline(value);
    else if (fieldName === 'dob') offlineResult = validateAgeOffline(value, extra.serviceType);
    else if (fieldName === 'pincode') offlineResult = validatePincodeOffline(value);

    if (offlineResult) {
      const status = offlineResult.valid ? (offlineResult.warning ? 'warning' : 'valid') : 'error';
      setFieldState(fieldName, { status, ...offlineResult });
      
      // Also validate online for enhanced results if connected
      if (isOnline && offlineResult.valid) {
        try {
          let result;
          if (fieldName === 'aadhaar') result = await validateAPI.aadhaar(value);
          else if (fieldName === 'ifscCode') result = await validateAPI.ifsc(value);
          else if (fieldName === 'mobile') result = await validateAPI.mobile(value);
          else if (fieldName === 'dob') result = await validateAPI.age(value, extra.serviceType);
          else if (fieldName === 'pincode') result = await validateAPI.pincode(value);
          if (result) setFieldState(fieldName, { status: result.valid ? (result.warning ? 'warning' : 'valid') : 'error', ...result });
        } catch {}
      }
    }
    return offlineResult;
  }, [isOnline, setFieldState]);

  const getFieldClass = useCallback((fieldName) => {
    const state = fieldStates[fieldName];
    if (!state || state.status === 'empty') return '';
    return state.status;
  }, [fieldStates]);

  return { fieldStates, validate, getFieldClass, setFieldState };
}
