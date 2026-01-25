/**
 * 加密模块 - 使用 Web Crypto API 实现 AES-256-GCM 加密
 * 
 * 设计理念: 
 * - 使用 PBKDF2 从用户密码派生 256 位密钥
 * - 使用 AES-256-GCM 加密敏感数据
 * - 每次加密生成新的随机 IV 和 Salt
 * - 加密数据以 JSON 格式存储
 */

export interface EncryptedData {
  iv: string;           // Base64 编码的初始化向量
  ciphertext: string;   // Base64 编码的密文
  salt: string;         // Base64 编码的盐值
  algorithm: string;    // 加密算法标识符
}

const ALGORITHM = 'AES-256-GCM';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12;  // 96 bits for GCM
const SALT_LENGTH = 16; // 128 bits
const PBKDF2_ITERATIONS = 100000;

/**
 * 将 ArrayBuffer 转换为 Base64 字符串
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * 将 Base64 字符串转换为 ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * 生成随机的 Uint8Array
 */
function generateRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * 从密码派生加密密钥
 */
async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  // 1. 将密码转换为 Uint8Array
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // 2. 导入密码作为 PBKDF2 的密钥材料
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  // 3. 使用 PBKDF2 派生密钥
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH * 8 },
    false,
    ['encrypt', 'decrypt']
  );

  return derivedKey;
}

/**
 * 加密文本数据
 */
export async function encryptText(
  plaintext: string,
  password: string
): Promise<EncryptedData> {
  try {
    // 1. 生成随机 Salt 和 IV
    const salt = generateRandomBytes(SALT_LENGTH);
    const iv = generateRandomBytes(IV_LENGTH);

    // 2. 派生加密密钥
    const key = await deriveKey(password, salt);

    // 3. 将明文转换为 Uint8Array
    const encoder = new TextEncoder();
    const plaintextBuffer = encoder.encode(plaintext);

    // 4. 使用 AES-256-GCM 加密
    const ciphertextBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      plaintextBuffer
    );

    // 5. 将结果转换为 Base64 并返回
    return {
      iv: arrayBufferToBase64(iv),
      ciphertext: arrayBufferToBase64(ciphertextBuffer),
      salt: arrayBufferToBase64(salt),
      algorithm: ALGORITHM,
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('加密失败');
  }
}

/**
 * 解密文本数据
 */
export async function decryptText(
  encryptedData: EncryptedData,
  password: string
): Promise<string> {
  try {
    // 1. 从 Base64 解码 IV、Salt 和密文
    const iv = new Uint8Array(base64ToArrayBuffer(encryptedData.iv));
    const salt = new Uint8Array(base64ToArrayBuffer(encryptedData.salt));
    const ciphertextBuffer = base64ToArrayBuffer(encryptedData.ciphertext);

    // 2. 派生解密密钥 (使用相同的 Salt)
    const key = await deriveKey(password, salt);

    // 3. 使用 AES-256-GCM 解密
    const plaintextBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      ciphertextBuffer
    );

    // 4. 将解密结果转换为字符串
    const decoder = new TextDecoder();
    const plaintext = decoder.decode(plaintextBuffer);

    return plaintext;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('解密失败，密码可能不正确');
  }
}

/**
 * 验证密码是否正确 (通过尝试解密一个已知的加密数据)
 */
export async function verifyPassword(
  encryptedData: EncryptedData,
  password: string
): Promise<boolean> {
  try {
    await decryptText(encryptedData, password);
    return true;
  } catch {
    return false;
  }
}

/**
 * 生成一个测试加密数据用于验证密码
 */
export async function generatePasswordVerificationData(
  password: string
): Promise<EncryptedData> {
  const testData = 'password_verification_token';
  return encryptText(testData, password);
}
