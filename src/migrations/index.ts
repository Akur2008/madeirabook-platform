import * as migration_20261013_165246_init from './20261013_165246_init';
import * as migration_20261013_165604_add_properties_fields_and_house_rules from './20261013_165604_add_properties_fields_and_house_rules';
import * as migration_20261013_170112_media_url_fields from './20261013_170112_media_url_fields';
import * as migration_20261014_182443_add_is_platform_and_commission from './20261014_182443_add_is_platform_and_commission';
import * as migration_20261014_184836_add_webhook_events_collection from './20261014_184836_add_webhook_events_collection';
import * as migration_20261014_184907_add_bookings_collection from './20261014_184907_add_bookings_collection';
import * as migration_20261014_192739_add_email_queue_collection from './20261014_192739_add_email_queue_collection';
import * as migration_20261014_202707_add_referrals_and_affiliate_payouts from './20261014_202707_add_referrals_and_affiliate_payouts';
import * as migration_20261015_144234_add_beaches_collection from './20261015_144234_add_beaches_collection';
import * as migration_20261015_151038_add_applications_collection from './20261015_151038_add_applications_collection';
import * as migration_20261015_151129_extend_referrals_with_ambassador_fields from './20261015_151129_extend_referrals_with_ambassador_fields';
import * as migration_20261015_174058_add_restaurants_collection from './20261015_174058_add_restaurants_collection';
import * as migration_20261015_184546_add_uploads_collection from './20261015_184546_add_uploads_collection';
import * as migration_20261015_185608_add_media_fields_to_beaches_and_restaurants from './20261015_185608_add_media_fields_to_beaches_and_restaurants';
import * as migration_20261015_215036_add_guides_collection from './20261015_215036_add_guides_collection';
import * as migration_20261015_234434_add_trails_and_viewpoints from './20261015_234434_add_trails_and_viewpoints';
import * as migration_20261016_153342_add_owner_magic_auth_fields from './20261016_153342_add_owner_magic_auth_fields';
import * as migration_20261016_235314_sync_is_verified from './20261016_235314_sync_is_verified';
import * as migration_20261017_003237_add_leads_collection from './20261017_003237_add_leads_collection';
import * as migration_20261017_125504_add_selected_restaurants_to_referrals from './20261017_125504_add_selected_restaurants_to_referrals';
import * as migration_20261017_142753_add_comment_id_to_leads from './20261017_142753_add_comment_id_to_leads';
import * as migration_20261017_154056_add_owner_subscription_fields from './20261017_154056_add_owner_subscription_fields';
import * as migration_20261017_175620_add_pms_fields from './20261017_175620_add_pms_fields';

export const migrations = [
  {
    up: migration_20261013_165246_init.up,
    down: migration_20261013_165246_init.down,
    name: '20261013_165246_init',
  },
  {
    up: migration_20261013_165604_add_properties_fields_and_house_rules.up,
    down: migration_20261013_165604_add_properties_fields_and_house_rules.down,
    name: '20261013_165604_add_properties_fields_and_house_rules',
  },
  {
    up: migration_20261013_170112_media_url_fields.up,
    down: migration_20261013_170112_media_url_fields.down,
    name: '20261013_170112_media_url_fields',
  },
  {
    up: migration_20261014_182443_add_is_platform_and_commission.up,
    down: migration_20261014_182443_add_is_platform_and_commission.down,
    name: '20261014_182443_add_is_platform_and_commission',
  },
  {
    up: migration_20261014_184836_add_webhook_events_collection.up,
    down: migration_20261014_184836_add_webhook_events_collection.down,
    name: '20261014_184836_add_webhook_events_collection',
  },
  {
    up: migration_20261014_184907_add_bookings_collection.up,
    down: migration_20261014_184907_add_bookings_collection.down,
    name: '20261014_184907_add_bookings_collection',
  },
  {
    up: migration_20261014_192739_add_email_queue_collection.up,
    down: migration_20261014_192739_add_email_queue_collection.down,
    name: '20261014_192739_add_email_queue_collection',
  },
  {
    up: migration_20261014_202707_add_referrals_and_affiliate_payouts.up,
    down: migration_20261014_202707_add_referrals_and_affiliate_payouts.down,
    name: '20261014_202707_add_referrals_and_affiliate_payouts',
  },
  {
    up: migration_20261015_144234_add_beaches_collection.up,
    down: migration_20261015_144234_add_beaches_collection.down,
    name: '20261015_144234_add_beaches_collection',
  },
  {
    up: migration_20261015_151038_add_applications_collection.up,
    down: migration_20261015_151038_add_applications_collection.down,
    name: '20261015_151038_add_applications_collection',
  },
  {
    up: migration_20261015_151129_extend_referrals_with_ambassador_fields.up,
    down: migration_20261015_151129_extend_referrals_with_ambassador_fields.down,
    name: '20261015_151129_extend_referrals_with_ambassador_fields',
  },
  {
    up: migration_20261015_174058_add_restaurants_collection.up,
    down: migration_20261015_174058_add_restaurants_collection.down,
    name: '20261015_174058_add_restaurants_collection',
  },
  {
    up: migration_20261015_184546_add_uploads_collection.up,
    down: migration_20261015_184546_add_uploads_collection.down,
    name: '20261015_184546_add_uploads_collection',
  },
  {
    up: migration_20261015_185608_add_media_fields_to_beaches_and_restaurants.up,
    down: migration_20261015_185608_add_media_fields_to_beaches_and_restaurants.down,
    name: '20261015_185608_add_media_fields_to_beaches_and_restaurants',
  },
  {
    up: migration_20261015_215036_add_guides_collection.up,
    down: migration_20261015_215036_add_guides_collection.down,
    name: '20261015_215036_add_guides_collection',
  },
  {
    up: migration_20261015_234434_add_trails_and_viewpoints.up,
    down: migration_20261015_234434_add_trails_and_viewpoints.down,
    name: '20261015_234434_add_trails_and_viewpoints',
  },
  {
    up: migration_20261016_153342_add_owner_magic_auth_fields.up,
    down: migration_20261016_153342_add_owner_magic_auth_fields.down,
    name: '20261016_153342_add_owner_magic_auth_fields',
  },
  {
    up: migration_20261016_235314_sync_is_verified.up,
    down: migration_20261016_235314_sync_is_verified.down,
    name: '20261016_235314_sync_is_verified',
  },
  {
    up: migration_20261017_003237_add_leads_collection.up,
    down: migration_20261017_003237_add_leads_collection.down,
    name: '20261017_003237_add_leads_collection',
  },
  {
    up: migration_20261017_125504_add_selected_restaurants_to_referrals.up,
    down: migration_20261017_125504_add_selected_restaurants_to_referrals.down,
    name: '20261017_125504_add_selected_restaurants_to_referrals',
  },
  {
    up: migration_20261017_142753_add_comment_id_to_leads.up,
    down: migration_20261017_142753_add_comment_id_to_leads.down,
    name: '20261017_142753_add_comment_id_to_leads',
  },
  {
    up: migration_20261017_154056_add_owner_subscription_fields.up,
    down: migration_20261017_154056_add_owner_subscription_fields.down,
    name: '20261017_154056_add_owner_subscription_fields',
  },
  {
    up: migration_20261017_175620_add_pms_fields.up,
    down: migration_20261017_175620_add_pms_fields.down,
    name: '20261017_175620_add_pms_fields'
  },
];
