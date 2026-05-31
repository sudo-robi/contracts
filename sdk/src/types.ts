export interface StealthMetaAddress {
  spendingPublicKey: Uint8Array;
  viewingPublicKey: Uint8Array;
}

export interface StealthKeys {
  stealthPublicKey: Uint8Array;
  sharedSecret: Uint8Array;
}

export interface Announcement {
  schemeId: number;
  stealthAddress: Uint8Array;
  ephemeralPubKey: Uint8Array;
  metadata: Uint8Array;
}

export interface DerivePrivateKeyResult {
  stealthPrivateKey: Uint8Array;
}
