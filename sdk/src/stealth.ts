import { ed25519 } from '@noble/curves/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import {
  Announcement,
  DerivePrivateKeyResult,
  StealthKeys,
  StealthMetaAddress,
} from './types';
import {
  decodeStealthMetaAddress,
  encodeStealthMetaAddress,
  equalBytes,
} from './utils';

export {
  decodeStealthMetaAddress,
  encodeStealthMetaAddress,
  equalBytes,
} from './utils';
export type {
  Announcement,
  DerivePrivateKeyResult,
  StealthKeys,
  StealthMetaAddress,
};

const POINT_ADDITION_RESULT_LENGTH = 32;

function computeSharedSecret(
  ephemeralPubKey: Uint8Array,
  viewingSecretKey: Uint8Array,
): Uint8Array {
  const shared = ed25519.getSharedSecret(viewingSecretKey, ephemeralPubKey);
  return sha512(shared);
}

function deriveStealthPublicKey(
  spendingPublicKey: Uint8Array,
  sharedSecret: Uint8Array,
): Uint8Array {
  const scalar = ed25519.utils.bytesToNumberLE(sharedSecret.slice(0, 32));
  const point = ed25519.Point.BASE.multiply(scalar);
  const spendingPoint = ed25519.Point.fromHex(spendingPublicKey);
  const result = spendingPoint.add(point);
  return result.toRawBytes(true);
}

export function generateKeyPair(): {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
} {
  const secretKey = ed25519.utils.randomPrivateKey();
  const publicKey = ed25519.getPublicKey(secretKey);
  return { secretKey, publicKey };
}

export function generateStealthKeys(
  metaAddress: Uint8Array | StealthMetaAddress,
): StealthKeys {
  const meta =
    metaAddress instanceof Uint8Array
      ? decodeStealthMetaAddress(metaAddress)
      : metaAddress;

  const ephemeralSecretKey = ed25519.utils.randomPrivateKey();
  const ephemeralPubKey = ed25519.getPublicKey(ephemeralSecretKey);

  const sharedSecret = computeSharedSecret(
    meta.viewingPublicKey,
    ephemeralSecretKey,
  );

  const stealthPublicKey = deriveStealthPublicKey(
    meta.spendingPublicKey,
    sharedSecret,
  );

  return { stealthPublicKey, sharedSecret };
}

export function deriveStealthKeys(signature: Uint8Array): {
  ephemeralPubKey: Uint8Array;
  sharedSecretComponent: Uint8Array;
} {
  if (signature.length < 64) {
    throw new Error('signature must be at least 64 bytes');
  }

  const ephemeralPubKey = signature.slice(0, 32);
  const sharedSecretComponent = signature.slice(32, 64);

  return { ephemeralPubKey, sharedSecretComponent };
}

export function generateStealthAddress(
  spendingPublicKey: Uint8Array,
  viewingPublicKey: Uint8Array,
): {
  stealthPublicKey: Uint8Array;
  ephemeralPubKey: Uint8Array;
} {
  const ephemeralSecretKey = ed25519.utils.randomPrivateKey();
  const ephemeralPubKey = ed25519.getPublicKey(ephemeralSecretKey);

  const sharedSecret = computeSharedSecret(viewingPublicKey, ephemeralSecretKey);

  const stealthPublicKey = deriveStealthPublicKey(
    spendingPublicKey,
    sharedSecret,
  );

  return { stealthPublicKey, ephemeralPubKey };
}

export function scanAnnouncements(
  announcements: Announcement[],
  viewingSecretKey: Uint8Array,
  spendingPublicKey: Uint8Array,
): { announcement: Announcement; stealthPublicKey: Uint8Array }[] {
  const results: {
    announcement: Announcement;
    stealthPublicKey: Uint8Array;
  }[] = [];

  for (const ann of announcements) {
    const sharedSecret = computeSharedSecret(
      ann.ephemeralPubKey,
      viewingSecretKey,
    );

    const stealthPublicKey = deriveStealthPublicKey(
      spendingPublicKey,
      sharedSecret,
    );

    if (equalBytes(stealthPublicKey, ann.stealthAddress)) {
      results.push({ announcement: ann, stealthPublicKey });
    }
  }

  return results;
}

export function deriveStealthPrivateKey(
  spendingSecretKey: Uint8Array,
  ephemeralPubKey: Uint8Array,
  viewingSecretKey: Uint8Array,
): DerivePrivateKeyResult {
  const sharedSecret = computeSharedSecret(
    ephemeralPubKey,
    viewingSecretKey,
  );

  const secretScalar = sharedSecret.slice(0, 32);
  const spendingScalar = spendingSecretKey.slice(0, 32);

  const combined = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    combined[i] = (spendingScalar[i] + secretScalar[i]) & 0xff;
  }

  const stealthPublicKey = ed25519.getPublicKey(combined);

  return { stealthPrivateKey: combined };
}

export function signWithScalar(
  scalar: Uint8Array,
  message: Uint8Array,
): Uint8Array {
  if (scalar.length !== 32) {
    throw new Error('scalar must be 32 bytes');
  }
  return ed25519.sign(message, scalar);
}

export function createAnnouncement(
  schemeId: number,
  spendingPublicKey: Uint8Array,
  viewingPublicKey: Uint8Array,
  metadata: Uint8Array = new Uint8Array(),
): {
  announcement: Announcement;
} {
  const { stealthPublicKey, ephemeralPubKey } = generateStealthAddress(
    spendingPublicKey,
    viewingPublicKey,
  );

  return {
    announcement: {
      schemeId,
      stealthAddress: stealthPublicKey,
      ephemeralPubKey,
      metadata,
    },
  };
}

export function generateAnnouncements(
  count: number,
  spendingPublicKey: Uint8Array,
  viewingPublicKey: Uint8Array,
  metadata: Uint8Array = new Uint8Array(),
  targetIndex?: number,
): Announcement[] {
  const announcements: Announcement[] = [];
  const target = targetIndex ?? Math.floor(Math.random() * count);

  for (let i = 0; i < count; i++) {
    if (i === target) {
      const { announcement } = createAnnouncement(
        1,
        spendingPublicKey,
        viewingPublicKey,
        metadata,
      );
      announcements.push(announcement);
    } else {
      const randomSpending = ed25519.utils.randomPrivateKey();
      const randomViewing = ed25519.utils.randomPrivateKey();
      const randomSpendingPub = ed25519.getPublicKey(randomSpending);
      const randomViewingPub = ed25519.getPublicKey(randomViewing);

      const { announcement } = createAnnouncement(
        1,
        randomSpendingPub,
        randomViewingPub,
        metadata,
      );
      announcements.push(announcement);
    }
  }

  return announcements;
}
