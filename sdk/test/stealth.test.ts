import {
  describe,
  expect,
  test,
} from 'vitest';
import {
  createAnnouncement,
  deriveStealthKeys,
  deriveStealthPrivateKey,
  generateAnnouncements,
  generateKeyPair,
  generateStealthAddress,
  scanAnnouncements,
  signWithScalar,
  decodeStealthMetaAddress,
  encodeStealthMetaAddress,
  equalBytes,
} from '../src/index';

describe('Stealth Address Protocol', () => {
  test('should generate key pair', () => {
    const { publicKey, secretKey } = generateKeyPair();
    expect(secretKey.length).toBe(32);
    expect(publicKey.length).toBe(32);
    expect(publicKey).toEqual(
      // from noble/ed25519 docs
      expect.any(Uint8Array),
    );
  });

  test('should encode and decode meta-address', () => {
    const spendingKey = new Uint8Array(32).fill(1);
    const viewingKey = new Uint8Array(32).fill(2);
    const meta = {
      spendingPublicKey: spendingKey,
      viewingPublicKey: viewingKey,
    };

    const encoded = encodeStealthMetaAddress(meta);
    expect(encoded.length).toBe(64);
    expect(encoded.slice(0, 32)).toEqual(spendingKey);
    expect(encoded.slice(32, 64)).toEqual(viewingKey);

    const decoded = decodeStealthMetaAddress(encoded);
    expect(equalBytes(decoded.spendingPublicKey, spendingKey)).toBe(true);
    expect(equalBytes(decoded.viewingPublicKey, viewingKey)).toBe(true);
  });

  test('should generate stealth address', () => {
    const spendingKey = new Uint8Array(32).fill(1);
    const viewingKey = new Uint8Array(32).fill(2);
    const { stealthPublicKey, ephemeralPubKey } = generateStealthAddress(
      spendingKey,
      viewingKey,
    );

    expect(stealthPublicKey.length).toBe(32);
    expect(ephemeralPubKey.length).toBe(32);
    // Stealth address should be different from spending key
    expect(equalBytes(stealthPublicKey, spendingKey)).toBe(false);
  });

  test('should create and parse announcement', () => {
    const spendingKey = new Uint8Array(32).fill(1);
    const viewingKey = new Uint8Array(32).fill(2);
    const metadata = new TextEncoder().encode('Hello World');

    const { announcement } = createAnnouncement(
      1,
      spendingKey,
      viewingKey,
      metadata,
    );

    expect(announcement.schemeId).toBe(1);
    expect(equalBytes(announcement.stealthAddress, spendingKey)).toBe(false); // Should be derived
    expect(announcement.ephemeralPubKey.length).toBe(32);
    expect(announcement.metadata).toEqual(metadata);
  });

  test('should scan announcements correctly', () => {
    const spendingKey = new Uint8Array(32).fill(1);
    const viewingKey = new Uint8Array(32).fill(2);
    const secretViewingKey = new Uint8Array(32).fill(3);

    // Create announcements - one for our keys, others random
    const announcements = generateAnnouncements(
      10,
      spendingKey,
      viewingKey,
      new Uint8Array(),
      5, // target index
    );

    const results = scanAnnouncements(
      announcements,
      secretViewingKey,
      spendingKey,
    );

    expect(results.length).toBe(1);
    expect(results[0].announcement).toEqual(announcements[5]);
  });

  test('should derive stealth private key', () => {
    const spendingSecretKey = new Uint8Array(32).fill(4);
    const ephemeralPubKey = new Uint8Array(32).fill(5);
    const viewingSecretKey = new Uint8Array(32).fill(6);

    const result = deriveStealthPrivateKey(
      spendingSecretKey,
      ephemeralPubKey,
      viewingSecretKey,
    );

    expect(result.stealthPrivateKey.length).toBe(32);
  });

  test('should sign with scalar', () => {
    const scalar = new Uint8Array(32).fill(7);
    const message = new TextEncoder().encode('test message');

    const signature = signWithScalar(scalar, message);
    expect(signature.length).toBe(64); // Ed25519 signature is 64 bytes
  });

  test('should handle invalid meta-address encoding', () => {
    expect(() => {
      encodeStealthMetaAddress({
        spendingPublicKey: new Uint8Array(31).fill(1), // too short
        viewingPublicKey: new Uint8Array(32).fill(2),
      });
    }).toThrow(/spendingPublicKey must be 32 bytes/);

    expect(() => {
      encodeStealthMetaAddress({
        spendingPublicKey: new Uint8Array(32).fill(1),
        viewingPublicKey: new Uint8Array(31).fill(2), // too short
      });
    }).toThrow(/viewingPublicKey must be 32 bytes/);
  });

  test('should handle invalid meta-address decoding', () => {
    expect(() => {
      decodeStealthMetaAddress(new Uint8Array(63)); // too short
    }).toThrow(/encoded meta-address must be 64 bytes/);

    expect(() => {
      decodeStealthMetaAddress(new Uint8Array(65)); // too long
    }).toThrow(/encoded meta-address must be 64 bytes/);
  });
});
