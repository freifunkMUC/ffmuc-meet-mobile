import { ReserveError } from './reserve/client';
import { MessageKey, t } from './i18n';

/** A text for the user, for any error. */
export function errorText(e: unknown): string {
  if (e instanceof ReserveError) {
    return t(`error.${e.code}` as MessageKey, { status: e.status });
  }
  return t('error.network');
}
