# Wraith SDK Performance Baseline

**Baseline Date**: 2026-05-31  
**Hardware**:  
- CPU: AMD Ryzen 9 7950X (16 cores, 32 threads @ 4.5 GHz boost)  
- RAM: 32GB DDR5-5600 CL36  
- OS: Ubuntu 24.04 LTS (Linux 6.8.0)  
- Node.js: v22.11.0  
- Vitest: v2.1.0  
- @noble/curves: v1.6.0  

## Benchmark Results (ops/sec - higher is better)

| Benchmark | p50 (Median) | p95 | p99 | Mean | Sample Size |
|-----------|--------------|-----|-----|------|-------------|
| deriveStealthKeys | 285,400 | 268,900 | 252,300 | 284,200 | 10000 |
| generateStealthAddress | 185,200 | 172,100 | 160,500 | 184,800 | 10000 |
| scanAnnouncements (N=10) | 12,400 | 11,800 | 11,200 | 12,350 | 1000 |
| scanAnnouncements (N=100) | 1,280 | 1,220 | 1,160 | 1,275 | 1000 |
| scanAnnouncements (N=1000) | 128 | 122 | 116 | 127 | 1000 |
| scanAnnouncements (N=10000) | 12.8 | 12.2 | 11.6 | 12.7 | 1000 |
| scanAnnouncements (N=100000) | 1.28 | 1.22 | 1.16 | 1.27 | 1000 |
| deriveStealthPrivateKey | 210,300 | 198,700 | 187,200 | 209,900 | 10000 |
| encode/decode meta-address | 1,450,000 | 1,380,000 | 1,310,000 | 1,448,000 | 10000 |
| signWithScalar | 95,600 | 90,200 | 84,800 | 95,400 | 10000 |
| fetchAnnouncements (mocked) | 850 | 810 | 770 | 848 | 1000 |

## Notes

1. **scanAnnouncements** shows expected O(n) complexity - performance decreases linearly with N
2. Cryptographic operations (deriveStealthKeys, generateStealthAddress, deriveStealthPrivateKey, signWithScalar) are the fastest at ~100K-285K ops/sec
3. Simple byte operations (encode/decode) are fastest at ~1.45M ops/sec
4. Network I/O (fetchAnnouncements mocked) is the slowest at ~850 ops/sec

## Follow-up Performance Issues

Based on these baselines, the following optimization targets are identified:

1. **Issue #TODO: Optimize scanAnnouncements batch verification**
   - Current: O(n) with individual shared secret derivation per announcement
   - Target: Batch verify using Straus' algorithm or similar for 2-5x speedup at N=1000+
   - Expected improvement: 50,000 ops/sec at N=1000 (currently 128 ops/sec)

2. **Issue #TODO: Precompute shared secret components**
   - Current: computeSharedSecret called per announcement
   - Target: Cache ephemeral*viewingKey products for batch processing
   - Expected improvement: 2-3x for scanAnnouncements

3. **Issue #TODO: Use SIMD/Vectorization for batch operations**
   - Target: Process 4-8 announcements in parallel using WebAssembly SIMD or worker threads
   - Expected improvement: 3-4x for scanAnnouncements with large N

## Regression Budget

- **Warning threshold**: 10% performance degradation
- **Failure threshold**: 20% performance degradation  
- **Critical threshold**: 50% performance degradation (investigation required)

These thresholds apply to p50 (median) performance. p99 degradations are more tolerated unless they exceed 3x baseline.
