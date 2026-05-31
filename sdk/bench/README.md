# Wraith SDK Benchmarks

This directory contains performance benchmarks for the Wraith stealth address protocol SDK.

## Hardware Used for Baseline

- **CPU**: AMD Ryzen 9 7950X (16 cores, 32 threads)
- **RAM**: 32GB DDR5-5600
- **OS**: Ubuntu 24.04 LTS
- **Node.js**: v22.11.0
- **Vitest**: v2.1.0

## How to Run Benchmarks

```bash
# Install dependencies (if not already installed)
pnpm install

# Run benchmarks once
pnpm bench

# Run benchmarks with UI (watch mode)
pnpm bench:ui
```

## Benchmark Results Format

Benchmarks report measurements in operations per second (ops/sec) and include:

- **Mean**: Average operations per second
- **Median (p50)**: 50th percentile - typical performance
- **p95**: 95th percentile - performance under load
- **p99**: 99th percentile - worst-case performance
- **Min/Max**: Fastest and slowest single operation observed

## Comparing Against Previous Runs

Benchmark results are saved to `bench/results.json` in JSON format. To compare:

1. Save current results: `cp bench/results.json bench/previous.json`
2. Make changes
3. Run benchmarks again
4. Use the comparison script (to be added) or manually compare:
   ```bash
   node -e "
   const prev = require('./bench/previous.json');
   const curr = require('./bench/results.json');
   console.log(JSON.stringify({ prev, curr }, null, 2));
   "
   ```

## Current Benchmarks

| Benchmark | Description |
|-----------|-------------|
| deriveStealthKeys | Extract ephemeral public key and shared secret component from signature |
| generateStealthAddress | Generate stealth public key and ephemeral key pair |
| scanAnnouncements (N=10,100,1000,10000,100000) | Scan announcements to find matching stealth addresses |
| deriveStealthPrivateKey | Compute stealth private key from ephemeral data |
| encode/decode meta-address | Round-trip conversion of stealth meta-address |
| signWithScalar | Ed25519 signing with specific scalar |
| fetchAnnouncements (mocked) | Simulate fetching announcements from Soroban RPC |

## Performance Goals

These benchmarks establish baseline performance for the stealth address protocol operations. Future optimizations should target:

1. **scanAnnouncements** - O(n) operation, primary target for optimization
2. **deriveStealthPrivateKey** - Scalar operations on elliptic curve
3. **generateStealthAddress** - Key pair generation and ECDH

Follow-up optimization issues will be created based on these baseline measurements.
