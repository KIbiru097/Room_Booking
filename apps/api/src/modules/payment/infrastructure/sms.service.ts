import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MockSmsService } from './mock-sms.service';

export interface SmsSendResult {
  provider: 'smsethiopia' | 'mock';
  accepted: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Normalizes Ethiopian phone numbers to the MSISDN format SMSEthiopia expects:
 * 2519XXXXXXXX (no plus, no spaces, no leading zero).
 * Accepts +251911234567, 0911234567, 251911234567, 911234567.
 */
export function normalizeEthiopianMsisdn(raw: string): string | null {
  if (!raw) return null;
  let digits = raw.replace(/[\s\-()+.]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (digits.startsWith('00251')) digits = digits.slice(2);
  if (digits.startsWith('251')) {
    // already country code; validate local part
  } else if (digits.startsWith('0')) {
    digits = `251${digits.slice(1)}`;
  } else if (digits.length === 9) {
    digits = `251${digits}`;
  } else {
    return null;
  }
  return /^251(9|7)\d{8}$/.test(digits) ? digits : null;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly provider: 'smsethiopia' | 'mock';
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(
    private readonly config: ConfigService,
    private readonly mockSms: MockSmsService,
  ) {
    this.provider =
      (config.get<string>('SMS_PROVIDER') as 'smsethiopia' | 'mock') ?? 'mock';
    this.apiUrl =
      config.get<string>('SMSETHIOPIA_API_URL') ??
      'https://smsethiopia.com/api/sms/send';
    this.apiKey = config.get<string>('SMSETHIOPIA_API_KEY') ?? '';
    this.timeoutMs = Number(config.get<string>('SMS_TIMEOUT_MS') ?? 10000);
  }

  get activeProvider(): string {
    return this.provider;
  }

  /**
   * Send an SMS. In mock mode, routes to the in-memory inbox so dev flows
   * keep working without external calls. Never throws — failures are logged
   * and returned so OTP flows can degrade gracefully.
   */
  async send(rawPhone: string, message: string): Promise<SmsSendResult> {
    const msisdn = normalizeEthiopianMsisdn(rawPhone);
    if (!msisdn) {
      this.logger.warn({
        message: 'Invalid phone number, SMS skipped',
        rawPhone,
      });
      return {
        provider: this.provider,
        accepted: false,
        error: 'invalid_phone',
      };
    }

    if (this.provider === 'mock' || !this.apiKey) {
      if (this.provider === 'smsethiopia' && !this.apiKey) {
        this.logger.warn(
          'SMS_PROVIDER=smsethiopia but SMSETHIOPIA_API_KEY missing; falling back to mock',
        );
      }
      const msg = this.mockSms.send(`+${msisdn}`, message);
      return { provider: 'mock', accepted: true, messageId: msg.id };
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          KEY: this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ msisdn, text: message }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      const bodyText = await res.text();
      if (!res.ok) {
        this.logger.error({
          message: 'SMSEthiopia send failed',
          status: res.status,
          response: bodyText.slice(0, 500),
        });
        return {
          provider: 'smsethiopia',
          accepted: false,
          error: `http_${res.status}`,
        };
      }

      this.logger.log({
        message: 'SMS sent via SMSEthiopia',
        to: msisdn,
        status: res.status,
      });
      return {
        provider: 'smsethiopia',
        accepted: true,
        messageId: bodyText.slice(0, 100),
      };
    } catch (err) {
      this.logger.error({
        message: 'SMSEthiopia request error',
        error: err instanceof Error ? err.message : String(err),
      });
      return {
        provider: 'smsethiopia',
        accepted: false,
        error: 'network_error',
      };
    }
  }
}
