module.exports = {
  // Matches any time string in format: 01:20 or 9:25
  time_pattern: /^\d{1,2}:\d{2}(:\d{1,2})?/g,
  // Matches any date string in format: DD-MM-YYYY
  date_with_dash_pattern: /\d{1,2}-\d{1,2}-\d{4}/g,
  // Matches any date string in format: DD/MM/YYYY
  date_with_slash_pattern: /\d{1,2}\/\d{1,2}\/\d{4}/g,
  // Matches any ISO string date
  iso_string_date_pattern: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/gi,
  // Matches any of the following number pattern: 1-2-2, 1-2/3-4, 21 or 12/3
  selection_joined_with_dashes_pattern: /((\d+-)+\d+$)|^(\d+)$|(\d+)(-\d+)*\/(\d+)(-\d+)*/g,
  // Matches any string starting with 'nap'
  apiKeyPattern: /^(OVS\.|ADM\.|USR\.|USSD\.|MOB\.)(\w+-){5}(.*)$/gi,
  uuidV4Pattern: /[A-Fa-f0-9]{8}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-[A-Fa-f0-9]{4}-([A-Fa-f0-9]+$)/g,
  /**
   * Test valid url patterns
   * @param {string} testString url to test
   * @returns {boolean}
   */
  isUrl(testString) {
    return testString.match(/^http(s*):\/\/(.+)\.(.+)$/gi) !== null;
  }
};
