// Local reminders before a reserved room expires.

#import <React/RCTBridgeModule.h>
#import <UserNotifications/UserNotifications.h>

static NSString *const kPrefix = @"net.ffmuc.meet.reminder.";
// Set by AppDelegate when the user taps a reminder.
static NSString *const kPendingUrl = @"net.ffmuc.meet.pendingUrl";

@interface FfmucReminders : NSObject <RCTBridgeModule>
@end

@implementation FfmucReminders

RCT_EXPORT_MODULE(FfmucReminders)

RCT_EXPORT_METHOD(requestPermission
                  : (RCTPromiseResolveBlock)resolve reject
                  : (RCTPromiseRejectBlock)reject)
{
  [[UNUserNotificationCenter currentNotificationCenter]
      requestAuthorizationWithOptions:(UNAuthorizationOptionAlert | UNAuthorizationOptionSound)
                    completionHandler:^(BOOL granted, NSError *_Nullable error) {
                      resolve(@(granted));
                    }];
}

RCT_EXPORT_METHOD(schedule
                  : (NSString *)ident at
                  : (double)at title
                  : (NSString *)title body
                  : (NSString *)body url
                  : (NSString *)url resolve
                  : (RCTPromiseResolveBlock)resolve reject
                  : (RCTPromiseRejectBlock)reject)
{
  NSTimeInterval wait = at / 1000.0 - [[NSDate date] timeIntervalSince1970];
  if (wait < 1) {
    resolve(nil);
    return;
  }
  UNMutableNotificationContent *content = [UNMutableNotificationContent new];
  content.title = title;
  content.body = body;
  content.sound = [UNNotificationSound defaultSound];
  content.userInfo = @{@"url" : url};
  UNTimeIntervalNotificationTrigger *trigger =
      [UNTimeIntervalNotificationTrigger triggerWithTimeInterval:wait repeats:NO];
  UNNotificationRequest *req =
      [UNNotificationRequest requestWithIdentifier:[kPrefix stringByAppendingString:ident]
                                           content:content
                                           trigger:trigger];
  [[UNUserNotificationCenter currentNotificationCenter]
      addNotificationRequest:req
       withCompletionHandler:^(NSError *_Nullable error) {
         if (error) {
           reject(@"schedule", error.localizedDescription, error);
         } else {
           resolve(nil);
         }
       }];
}

RCT_EXPORT_METHOD(cancelAll
                  : (RCTPromiseResolveBlock)resolve reject
                  : (RCTPromiseRejectBlock)reject)
{
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  [center getPendingNotificationRequestsWithCompletionHandler:^(
              NSArray<UNNotificationRequest *> *_Nonnull requests) {
    NSMutableArray<NSString *> *ids = [NSMutableArray new];
    for (UNNotificationRequest *r in requests) {
      if ([r.identifier hasPrefix:kPrefix]) {
        [ids addObject:r.identifier];
      }
    }
    [center removePendingNotificationRequestsWithIdentifiers:ids];
    resolve(nil);
  }];
}

// The link of a tapped reminder, once. Covers a cold start of the app.
RCT_EXPORT_METHOD(takePendingUrl
                  : (RCTPromiseResolveBlock)resolve reject
                  : (RCTPromiseRejectBlock)reject)
{
  NSUserDefaults *d = [NSUserDefaults standardUserDefaults];
  NSString *url = [d stringForKey:kPendingUrl];
  [d removeObjectForKey:kPendingUrl];
  resolve(url);
}

@end
