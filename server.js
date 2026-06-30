import express from 'express';
import helmet from 'helmet';                             // Security headers
import rateLimit from 'express-rate-limit';             // Prevents abuse
import morgan from 'morgan';                            // Request logging
import googleLibPhoneNumber from 'google-libphonenumber';
import i18nCountries from 'i18n-iso-countries';
import { createRequire } from 'module';

// ---------- Setup i18n for country names ----------
const require = createRequire(import.meta.url);
const enLocale = require('i18n-iso-countries/langs/en.json');
i18nCountries.registerLocale(enLocale);

// ---------- Phone number utilities ----------
const { PhoneNumberUtil, PhoneNumberFormat } = googleLibPhoneNumber;
const phoneUtil = PhoneNumberUtil.getInstance();

// ---------- Express app ----------
const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Middleware ----------
app.use(helmet());                                     // Adds security headers (e.g., X‑Frame‑Options)

// Rate limiter: max 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/validate', limiter);                         // Apply only to the validation endpoint

app.use(express.json({ limit: '1mb' }));               // Limit JSON payload size
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(morgan('combined'));                           // Log requests to console (use 'tiny' in production if you want less)

// Serve static files (your frontend)
app.use(express.static('public'));

// ---------- Health check (for uptime monitoring) ----------
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ---------- Main validation endpoint ----------
app.post('/validate', (req, res) => {
  const { phoneNumber } = req.body;

  // Basic input validation
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return res.status(400).json({ error: 'Phone number is required and must be a string.' });
  }

  // Trim and remove excessive whitespace
  const cleanNumber = phoneNumber.trim();
  if (cleanNumber.length > 30) {                        // Reasonable upper bound
    return res.status(400).json({ error: 'Phone number is too long.' });
  }

  try {
    const number = phoneUtil.parse(cleanNumber);
    const isValid = phoneUtil.isValidNumber(number);
    const regionCode = isValid ? phoneUtil.getRegionCodeForNumber(number) : null;
    const countryName = regionCode ? i18nCountries.getName(regionCode, 'en') : null;

    const response = {
      valid: isValid,
      rawInput: cleanNumber,
      regionCode: regionCode || null,
      countryName: countryName || 'Unknown',
      nationalNumber: isValid ? number.getNationalNumber() : null,
      countryCode: isValid ? number.getCountryCode() : null,
      internationalFormat: isValid ? phoneUtil.format(number, PhoneNumberFormat.INTERNATIONAL) : null,
      e164Format: isValid ? phoneUtil.format(number, PhoneNumberFormat.E164) : null,
    };

    if (!isValid && phoneUtil.isPossibleNumber(number)) {
      response.message = 'Number is possible but not valid for the region.';
    }

    res.json(response);
  } catch (error) {
    // Distinguish between parsing errors and other errors
    const statusCode = error.message.includes('invalid country code') ? 400 : 400;
    res.status(statusCode).json({ error: error.message });
  }
});

// ---------- Global error handler (catches any unhandled errors) ----------
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'An internal server error occurred.' });
});

// ---------- Start server ----------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});