/**
 * Mock for environment variables (@env)
 * Used during testing to provide safe default values
 */

module.exports = {
  MAPTILER_API_KEY: 'test-api-key',
  API_URL: 'https://test-api.example.com',
  ENV: 'test',
  DEBUG: 'true',
  LOG_LEVEL: 'debug',
  MAPLIBRE_STYLE_URL: 'https://test-tiles.example.com/style.json',
};
