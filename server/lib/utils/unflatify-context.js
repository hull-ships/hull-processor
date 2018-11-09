module.exports = (context = {}) => ({
  useragent: context.useragent,
  device: {
    name: context.device_name
  },
  referrer: {
    url: context.referrer_url,
    host: context.referrer_host,
    path: context.referrer_path
  },
  os: {
    name: context.os_name,
    version: context.os_version
  },
  browser: {
    major: context.browser_major,
    name: context.browser_name,
    version: context.browser_version
  },
  location: {
    country: context.location_country,
    city: context.location_city,
    timezone: context.location_timezone,
    longitude: context.location_longitude,
    latitude: context.location_latitude,
    region: context.location_region,
    countryname: context.location_countryname,
    regionname: context.location_regionname,
    zipcode: context.location_zipcode
  },
  campaign: {
    term: context.campaign_term,
    medium: context.campaign_medium,
    name: context.campaign_name,
    content: context.campaign_content,
    source: context.campaign_source
  },
  ip: context.ip,
  page: {
    url: context.page_url,
    host: context.page_host,
    path: context.page_path
  }
});
