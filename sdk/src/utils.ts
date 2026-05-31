import { StealthMetaAddress } from './types';

const META_ADDRESS_LENGTH = 64;
const PUBLIC_KEY_LENGTH = 32;

export function encodeStealthMetaAddress(meta: StealthMetaAddress): Uint8Array {
  if (meta.spendingPublicKey.length !== PUBLIC_KEY_LENGTH) {
    throw new Error(
      `spendingPublicKey must be ${PUBLIC_KEY_LENGTH} bytes, got ${meta.spendingPublicKey.length}`,
    );
  }
  if (meta.viewingPublicKey.length !== PUBLIC_KEY_LENGTH) {
    throw new Error(
      `viewingPublicKey must be ${PUBLIC_KEY_LENGTH} bytes, got ${meta.viewingPublicKey.length}`,
    );
  }

  const encoded = new Uint8Array(META_ADDRESS_LENGTH);
  encoded.set(meta.spendingPublicKey, 0);
  encoded.set(meta.viewingPublicKey, PUBLIC_KEY_LENGTH);
  return encoded;
}

export function decodeStealthMetaAddress(
  encoded: Uint8Array,
): StealthMetaAddress {
  if (encoded.length !== META_ADDRESS_LENGTH) {
    throw new Error(
      `encoded meta-address must be ${META_ADDRESS_LENGTH} bytes, got ${encoded.length}`,
    );
  }

  return {
    spendingPublicKey: encoded.slice(0, PUBLIC_KEY_LENGTH),
    viewingPublicKey: encoded.slice(PUBLIC_KEY_LENGTH, META_ADDRESS_LENGTH),
  };
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('hex string must have even length');
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
