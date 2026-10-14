import * as migration_20261013_165246_init from './20261013_165246_init';
import * as migration_20261013_165604_add_properties_fields_and_house_rules from './20261013_165604_add_properties_fields_and_house_rules';
import * as migration_20261013_170112_media_url_fields from './20261013_170112_media_url_fields';
import * as migration_20261014_182443_add_is_platform_and_commission from './20261014_182443_add_is_platform_and_commission';

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
    name: '20261014_182443_add_is_platform_and_commission'
  },
];
