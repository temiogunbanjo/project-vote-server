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
  nap_bet_type_pattern: /^(nap-\d+)/gi,
  // Matches any string starting with 'perm'
  perm_bet_type_pattern: /^(perm-\d+)/gi,
  // Matches any string starting with 'permutation'
  permutation_bet_type_pattern: /^(permutation-\d{1,2})$/gi,
  nap_t_bet_type_pattern: /^(nap-\d+-t)/gi,
  perm_t_bet_type_pattern: /^(perm-\d+-t)/gi,
  nap_ol_bet_type_pattern: /^(nap-\d+-ol)/gi,
  perm_ol_bet_type_pattern: /^(perm-\d+-ol)/gi,
  first_xnd_bet_type_pattern: /1st-(\d)?nd/gi,
  n_bet_type_pattern: /^(n\d{1,2})$/gi,
  m_bet_type_pattern: /(^m(-?)\d{1,2})/gi,
  x_by_y_bet_type_pattern: /^(\d-by-\d)/gi,
  even_odd_bet_type_pattern: /^(1st|last|most)-(\d-|or-last-|and-last-)?(odd|even)$/gi,
  w_by_m_bet_type_pattern: /^(\dw-by-\dm)/gi,
  n_against_bet_type_pattern: /^(\d|banker)-against/gi,
  perm_against_bet_type_pattern: /^perm-against/gi,
  n_no_draw_bet_type_pattern: /\d{1,2}-no-draw/gi,
  n_box_bet_type_pattern: /(.+)-box$/gi,
  nDirectBetTypePattern: /^(\d{1,2})-direct$/gi,
  over_under_bet_type_pattern: /(^over$|^under$)/gi,
  // Matches any string starting with 'system'
  systemBetTypePattern: /^system$/gi,
  // Matches any string in the format: 'all-<1-99>'
  allXBetTypePattern: /^(all-\d{1,2})$/gi,
  absoluteAllXBetTypePattern: /^(\*all-\d{1,2}\*)$/gi,
  // Matches anaconda string in the format: 'anaconda-<1-99>'
  anacondaNBetTypePattern: /^anaconda-(\d{1,2})$/gi,
  // Matches any string in the format: 'all-<1-99>'
  anyXBetTypePattern: /^(any-\d{1,2})$/gi,
  // Matches any colour ratio bet type: any-colour-2, ratio-2-2-2...
  colourRatioBetTypePattern: /(^ratio(-[1-6]){1,3}$)|(^any-colour-[2-6]$)|(^(1|no)-black$)/gi,
  // Matches any most colour bet type: most-blue, most yellow...
  mostColourBetTypePattern: /^most-(blue|red|yellow)$/gi,
  colourOverBetTypePattern: /^(blue|red|yellow)-(over|under)$/gi,
  firstOrLastNOverUnderBetTypePattern: /^(1st|last|sum)-(or-last-)?(\d{1,2}-)?(over|under)$/gi,
  firstOrLastNBallOverUnderBetTypePattern: /^(1st|last)-(or-last-|and-last-)?(\d{1,2}-)?ball(s)?-(over|under)$/gi,
  firstOrLastSingleOrDoubleBetTypePattern: /^(1st|last)-(or-last-|and-last-)?(\d{1,2}-)?(not-)?(single|double)$/gi,
  mixNBetTypePattern: /^mix-\d{1,2}$/gi,
  match_n_bet_type_pattern: /^match-\d{1,2}$/gi,
  perfect_n_bet_type_pattern: /perfect-\d{1,2}/gi,
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
