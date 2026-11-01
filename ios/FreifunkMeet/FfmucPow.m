// Proof of work for the room reservation service: finds a decimal nonce so
// that SHA-256(challenge + ":" + nonce) has enough leading zero bits.

#import <CommonCrypto/CommonDigest.h>
#import <React/RCTBridgeModule.h>

@interface FfmucPow : NSObject <RCTBridgeModule>
@end

static int LeadingZeroBits(const unsigned char *hash, size_t len)
{
  int n = 0;
  for (size_t i = 0; i < len; i++) {
    if (hash[i] == 0) {
      n += 8;
      continue;
    }
    return n + __builtin_clz((unsigned int)hash[i]) - 24;
  }
  return n;
}

@implementation FfmucPow

RCT_EXPORT_MODULE(FfmucPow)

- (dispatch_queue_t)methodQueue
{
  return dispatch_queue_create("net.ffmuc.meet.pow", DISPATCH_QUEUE_SERIAL);
}

RCT_EXPORT_METHOD(solve
                  : (NSString *)challenge difficulty
                  : (double)difficulty start
                  : (double)start count
                  : (double)count resolve
                  : (RCTPromiseResolveBlock)resolve reject
                  : (RCTPromiseRejectBlock)reject)
{
  NSData *prefix = [[challenge stringByAppendingString:@":"] dataUsingEncoding:NSUTF8StringEncoding];
  int need = (int)difficulty;
  long long first = (long long)start;
  long long last = first + (long long)count;
  unsigned char hash[CC_SHA256_DIGEST_LENGTH];
  char digits[32];
  for (long long n = first; n < last; n++) {
    int len = snprintf(digits, sizeof(digits), "%lld", n);
    CC_SHA256_CTX ctx;
    CC_SHA256_Init(&ctx);
    CC_SHA256_Update(&ctx, prefix.bytes, (CC_LONG)prefix.length);
    CC_SHA256_Update(&ctx, digits, (CC_LONG)len);
    CC_SHA256_Final(hash, &ctx);
    if (LeadingZeroBits(hash, sizeof(hash)) >= need) {
      resolve(@(n));
      return;
    }
  }
  resolve([NSNull null]);
}

@end
