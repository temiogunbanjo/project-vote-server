const { expect } = require("@jest/globals");
const HelperUtils = require("./HelperUtils");

const {
  combination,
  customDate,
  customDate2,
  customDateDayJs,
  timeStringToDate,
  mapAsFilter,
  factorial,
  print,
  printToFile,
  generateBundleId,
  inflateDPSSecretKey,
  deflateDPSSecretKey
} = HelperUtils;

describe('Helper utility tests', () => {
  test('DEFAULT_FILTERS Tests', () => {
    expect(HelperUtils.DEFAULT_FILTERS).toBeDefined();
    expect(HelperUtils.DEFAULT_FILTERS).toMatchObject({
      page: expect.anything(),
      limit: expect.anything(),
      startDate: expect.anything(),
      endDate: expect.anything(),
      minWalletBalance: expect.anything(),
      maxWalletBalance: expect.anything(),
      order: expect.anything()
    });
  });

  test('Print Test', () => {
    expect(print).toBeDefined();
    expect(() => print("Hey")).not.toThrowError();
  });

  test('Print To File Test', () => {
    expect(printToFile).toBeDefined();
    expect(() => printToFile("Hello")).not.toThrowError();
  });

  test('Factorial Test', () => {
    expect(factorial).toBeDefined();
    expect(() => factorial(1)).not.toThrowError();
    expect(factorial(1)).toBe(1);
  });

  test('Combination Test', () => {
    expect(combination).toBeDefined();
    expect(() => combination(1, 1)).not.toThrowError();
    expect(combination(1, 1)).toBe(1);
  });

  test('Array Sub-divider Test', () => {
    expect(HelperUtils.subdivideArray).toBeDefined();
    expect(() => HelperUtils.subdivideArray([1, 2, 3], 1)).not.toThrowError();
  });

  test('ConvertToDoubleDigits Test', () => {
    expect(HelperUtils.convertToDoubleDigits).toBeDefined();
    expect(() => HelperUtils.convertToDoubleDigits(1)).not.toThrowError();
    expect(() => HelperUtils.convertToDoubleDigits("1")).not.toThrowError();
    expect(HelperUtils.convertToDoubleDigits(1)).toBe("01");
  });

  test('CustomDate Test', () => {
    expect(customDate).toBeDefined();
    expect(() => customDate()).not.toThrowError();
    expect(() => customDate(new Date())).not.toThrowError();
  });

  test('CustomDate2 Test (Without timezone)', () => {
    expect(customDate2).toBeDefined();
    expect(() => customDate2()).not.toThrowError();
    expect(() => customDate2(new Date())).not.toThrowError();
  });

  test('DayJS Util Test', () => {
    expect(customDateDayJs).toBeDefined();
    expect(() => customDateDayJs()).not.toThrowError();
    expect(() => customDateDayJs(new Date())).not.toThrowError();
  });

  test('Format Time As Date Test', () => {
    expect(timeStringToDate).toBeDefined();
    expect(() => timeStringToDate('01:20:00')).not.toThrowError();
    expect(() => timeStringToDate()).not.toThrowError();
  });

  test('MapAsFilter Test', () => {
    const testQuery = { hey: "1" };
    expect(mapAsFilter).toBeDefined();
    expect(() => mapAsFilter()).toThrowError();
    expect(() => mapAsFilter({})).not.toThrowError();
    expect(mapAsFilter(testQuery)).toHaveProperty('hey', 1);
  });

  test('CapitalizeFirstLetters Test', () => {
    const testQuery = "joHn kiI";
    expect(HelperUtils.capitalizeFirstLetters).toBeDefined();
    expect(() => HelperUtils.capitalizeFirstLetters()).toThrowError();
    expect(() => HelperUtils.capitalizeFirstLetters(testQuery)).not.toThrowError();
    expect(HelperUtils.capitalizeFirstLetters(testQuery)).toBe('John Kii');
  });

  test('ArrayToCSV Test', () => {
    expect(HelperUtils.arrayToCSV).toBeDefined();
  });

  test('CheckDailyWalletThreshold Test', () => {
    expect(HelperUtils.checkDailyWalletThreshold).toBeDefined();
  });

  test('Generate Bundle ID Test', () => {
    expect(generateBundleId).toBeDefined();
    expect(() => generateBundleId()).not.toThrowError();

    const firstID = generateBundleId();
    const secondID = generateBundleId();

    expect(generateBundleId()).toMatch(/BUNDLE-[A-Z]{4}\d{5}/g);
    expect(firstID).not.toBe(secondID);
  });

  test('Inflate DPS Key Test', () => {
    expect(inflateDPSSecretKey).toBeDefined();
    expect(() => inflateDPSSecretKey()).not.toThrowError();

    const firstKey = 'HUX05COLELMERF3Q';
    const secondKey = 'HUX05COLELME-RF3Q';

    expect(inflateDPSSecretKey(firstKey)).toBe('HUX0-5COL-ELME-RF3Q');
    expect(inflateDPSSecretKey(secondKey)).toBe('HUX0-5COL-ELME-RF3Q');
  });

  test('Deflate DPS Key Test', () => {
    expect(deflateDPSSecretKey).toBeDefined();
    expect(() => deflateDPSSecretKey()).not.toThrowError();

    const firstKey = 'HUX0-5COL-ELME-RF3Q';
    const secondKey = 'HUX0-5COLELME-RF3Q';

    expect(deflateDPSSecretKey(firstKey)).toBe('HUX05COLELMERF3Q');
    expect(deflateDPSSecretKey(secondKey)).toBe('HUX05COLELMERF3Q');
  });
});
