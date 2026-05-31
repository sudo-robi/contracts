import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createAnnouncement,
  deriveStealthKeys,
  deriveStealthPrivateKey,
  generateAnnouncements,
  generateKeyPair,
  generateStealthAddress,
  scanAnnouncements,
  signWithScalar,
  encodeStealthMetaAddress,
  decodeStealthMetaAddress,
  StealthMetaAddress,
} from '../../src/index';

const { describe: benchDescribe, it: benchIt } = vi.benchmark;

// Mock fetchAnnouncements for benchmarking
async function fetchAnnouncementsMock(): Promise<any[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1));
  // Return some mock announcement data
  return Array.from({ length: 100 }, (_, i) => ({
    schemeId: 1,
    stealthAddress: new Uint8Array(32).fill(i % 256),
    ephemeralPubKey: new Uint8Array(32).fill((i + 1) % 256),
    metadata: new TextEncoder().encode(`metadata-${i}`),
  }));
}

// Test data generators
function generateTestData(): {
  spendingKey: Uint8Array;
  viewingKey: Uint8Array;
  secretSpendingKey: Uint8Array;
  secretViewingKey: Uint8Array;
  signature: Uint8Array;
  announcements: any[];
} {
  // Generate keypairs
  const { secretKey: spendingSecretKey, publicKey: spendingPublicKey } =
    generateKeyPair();
  const { secretKey: viewingSecretKey, publicKey: viewingPublicKey } =
    generateKeyPair();

  // Generate a test signature (simplified - in reality would be from ed25519.sign)
  const testMessage = new TextEncoder().encode('test');
  const signature = signWithScalar(spendingSecretKey, testMessage);

  // Generate announcements for scanning
  const announcements = generateAnnouncements(
    1000,
    spendingPublicKey,
    viewingPublicKey,
    new Uint8Array(),
    500, // target index
  );

  return {
    spendingKey: spendingPublicKey,
    viewingKey: viewingPublicKey,
    secretSpendingKey: spendingSecretKey,
    secretViewingKey: viewingSecretKey,
    signature,
    announcements,
  };
}

benchDescribe('Stealth Protocol Benchmarks', () => {
  let testData: ReturnType<typeof generateTestData>;

  beforeEach(() => {
    testData = generateTestData();
  });

  benchDescribe('deriveStealthKeys', () => {
    benchIt('should derive keys from signature', () => {
      deriveStealthKeys(testData.signature);
    });
  });

  benchDescribe('generateStealthAddress', () => {
    benchIt('should generate stealth address', () => {
      generateStealthAddress(testData.spendingKey, testData.viewingKey);
    });
  });

  benchDescribe('scanAnnouncements', () => {
    benchIt('N=10', () => {
      scanAnnouncements(
        testData.announcements.slice(0, 10),
        testData.secretViewingKey,
        testData.spendingKey,
      );
    });

    benchIt('N=100', () => {
      scanAnnouncements(
        testData.announcements.slice(0, 100),
        testData.secretViewingKey,
        testData.spendingKey,
      );
    });

    benchIt('N=1000', () => {
      scanAnnouncements(
        testData.announcements,
        testData.secretViewingKey,
        testData.spendingKey,
      );
    });

    benchIt('N=10000', () => {
      // Generate larger dataset
      const largeAnnouncements = generateAnnouncements(
        10000,
        testData.spendingKey,
        testData.viewingKey,
        new Uint8Array(),
        5000,
      );
      scanAnnouncements(
        largeAnnouncements,
        testData.secretViewingKey,
        testData.spendingKey,
      );
    });

    benchIt('N=100000', () => {
      // Generate very large dataset
      const hugeAnnouncements = generateAnnouncements(
        100000,
        testData.spendingKey,
        testData.viewingKey,
        new Uint8Array(),
        50000,
      );
      scanAnnouncements(
        hugeAnnouncements,
        testData.secretViewingKey,
        testData.spendingKey,
      );
    });
  });

  benchDescribe('deriveStealthPrivateKey', () => {
    benchIt('should derive private key', () => {
      deriveStealthPrivateKey(
        testData.secretSpendingKey,
        testData.viewingKey, // ephemeral pub key (using viewing pub for test)
        testData.secretViewingKey,
      );
    });
  });

  benchDescribe('encode/decode meta-address round-trip', () => {
    benchIt('should encode then decode', () => {
      const meta: StealthMetaAddress = {
        spendingPublicKey: testData.spendingKey,
        viewingPublicKey: testData.viewingKey,
      };
      const encoded = encodeStealthMetaAddress(meta);
      decodeStealthMetaAddress(encoded);
    });
  });

  benchDescribe('signWithScalar', () => {
    benchIt('should sign with scalar', () => {
      const scalar = new Uint8Array(32).fill(42);
      const message = new TextEncoder().encode('benchmark test');
      signWithScalar(scalar, message);
    });
  });

  benchDescribe('fetchAnnouncements (mocked)', () => {
    benchIt('should fetch announcements', async () => {
      await fetchAnnouncementsMock();
    });
  });
});
