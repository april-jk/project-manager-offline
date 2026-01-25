/**
 * 加密管理 Context
 * 
 * 设计理念:
 * - 管理用户的主密码和加密状态
 * - 提供加密/解密接口
 * - 支持密码验证和重置
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  encryptText,
  decryptText,
  verifyPassword,
  generatePasswordVerificationData,
  EncryptedData,
} from '@/lib/encryption';
import { getSettings, updateSettings } from '@/lib/storage';

interface EncryptionContextType {
  // 密码状态
  hasPassword: boolean;
  isPasswordUnlocked: boolean;

  // 密码操作
  setPassword: (password: string) => Promise<void>;
  unlockWithPassword: (password: string) => Promise<boolean>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  clearPassword: () => void;

  // 加密/解密操作
  encrypt: (plaintext: string) => Promise<EncryptedData>;
  decrypt: (encryptedData: EncryptedData) => Promise<string>;
}

const EncryptionContext = createContext<EncryptionContextType | undefined>(undefined);

export function EncryptionProvider({ children }: { children: React.ReactNode }) {
  const [hasPassword, setHasPassword] = useState(() => {
    const settings = getSettings();
    return settings.hasPassword || false;
  });

  const [isPasswordUnlocked, setIsPasswordUnlocked] = useState(!hasPassword);
  const [currentPassword, setCurrentPassword] = useState<string | null>(null);

  // ============ 密码操作 ============

  const setPassword = useCallback(async (password: string) => {
    try {
      const verificationData = await generatePasswordVerificationData(password);
      updateSettings({
        hasPassword: true,
        passwordVerificationData: verificationData,
      });
      setHasPassword(true);
      setCurrentPassword(password);
      setIsPasswordUnlocked(true);
    } catch (error) {
      console.error('Failed to set password:', error);
      throw new Error('设置密码失败');
    }
  }, []);

  const unlockWithPassword = useCallback(async (password: string) => {
    try {
      const settings = getSettings();
      if (!settings.passwordVerificationData) {
        throw new Error('没有设置密码');
      }

      const isValid = await verifyPassword(settings.passwordVerificationData, password);
      if (isValid) {
        setCurrentPassword(password);
        setIsPasswordUnlocked(true);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Password verification failed:', error);
      return false;
    }
  }, []);

  const changePassword = useCallback(
    async (oldPassword: string, newPassword: string) => {
      try {
        if (!currentPassword) {
          throw new Error('未解锁密码');
        }

        // 验证旧密码
        const isValid = await unlockWithPassword(oldPassword);
        if (!isValid) {
          throw new Error('旧密码不正确');
        }

        // 设置新密码
        await setPassword(newPassword);
      } catch (error) {
        console.error('Failed to change password:', error);
        throw error;
      }
    },
    [currentPassword, setPassword, unlockWithPassword]
  );

  const clearPassword = useCallback(() => {
    updateSettings({
      hasPassword: false,
      passwordVerificationData: undefined,
    });
    setHasPassword(false);
    setCurrentPassword(null);
    setIsPasswordUnlocked(true);
  }, []);

  // ============ 加密/解密操作 ============

  const encrypt = useCallback(
    async (plaintext: string) => {
      if (!currentPassword) {
        throw new Error('未设置密码或未解锁');
      }
      return encryptText(plaintext, currentPassword);
    },
    [currentPassword]
  );

  const decrypt = useCallback(
    async (encryptedData: EncryptedData) => {
      if (!currentPassword) {
        throw new Error('未设置密码或未解锁');
      }
      return decryptText(encryptedData, currentPassword);
    },
    [currentPassword]
  );

  const value: EncryptionContextType = {
    hasPassword,
    isPasswordUnlocked,
    setPassword,
    unlockWithPassword,
    changePassword,
    clearPassword,
    encrypt,
    decrypt,
  };

  return (
    <EncryptionContext.Provider value={value}>{children}</EncryptionContext.Provider>
  );
}

export function useEncryption() {
  const context = useContext(EncryptionContext);
  if (!context) {
    throw new Error('useEncryption must be used within EncryptionProvider');
  }
  return context;
}
