import googleLibPhoneNumber from 'google-libphonenumber';

const { PhoneNumberUtil, PhoneNumberFormat } = googleLibPhoneNumber;
const phoneUtil = PhoneNumberUtil.getInstance();

const main = () => {
  const rawInput = '+254703903056';
  try {
    const number = phoneUtil.parse(rawInput);

    if (phoneUtil.isValidNumber(number)) {
      console.log('✅ Number is valid');
      console.log('Region Code:', phoneUtil.getRegionCodeForNumber(number) || 'Unknown');
      console.log('National Number:', number.getNationalNumber());
      console.log('Country Code:', number.getCountryCode());
      console.log('International format:', phoneUtil.format(number, PhoneNumberFormat.INTERNATIONAL));
      console.log('E.164 format:', phoneUtil.format(number, PhoneNumberFormat.E164));
    } else {
      console.log('❌ Number is invalid');
      if (phoneUtil.isPossibleNumber(number)) {
        console.log('It is possible but not valid for the region.');
      }
    }
  } catch (e) {
    console.error('Error parsing number:', e.message);
  }
};

main();