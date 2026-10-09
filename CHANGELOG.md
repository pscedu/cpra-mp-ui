# Changelog

## [0.7.0](https://github.com/pscedu/cpra-mp-ui/compare/v0.6.0...v0.7.0) (2026-10-08)


### Features

* add derived variable and dimension analyses ([58a77d8](https://github.com/pscedu/cpra-mp-ui/commit/58a77d8f9dfe9bcbb9bfce05abb1868c16174323))


### Bug Fixes

* fix switching between derived variables ([800bd7a](https://github.com/pscedu/cpra-mp-ui/commit/800bd7a5e91bf38466373d1ac35d3b8d1f337efa))
* fix time series chart for lnd_chng and lnd_type_plus ([5a881bd](https://github.com/pscedu/cpra-mp-ui/commit/5a881bd6d80a70c391fdfd1bce8a3463832de189))
* remove unused glyph and sprite URL config variables ([440b36d](https://github.com/pscedu/cpra-mp-ui/commit/440b36d23e8378d02df3a72546dfb3cb9b39ccbb))
* restrict sediment dynamics to related variables ([db260bd](https://github.com/pscedu/cpra-mp-ui/commit/db260bd0133adf6f9629ad7827bf7d18aa963a9d))

## [0.6.0](https://github.com/pscedu/cpra-mp-ui/compare/v0.5.0...v0.6.0) (2026-08-31)


### Features

* **structure:** add display format columns ([3ad6ef1](https://github.com/pscedu/cpra-mp-ui/commit/3ad6ef1432620eb7ecf0f19a5d5998a7244ad70b))
* **structure:** add variable float precision ([e9bf516](https://github.com/pscedu/cpra-mp-ui/commit/e9bf5162d04ca2eae553dc0baff406f0363556c9))

## [0.5.0](https://github.com/pscedu/cpra-mp-ui/compare/v0.4.0...v0.5.0) (2026-08-19)


### Features

* **base-chart:** use dynamic chart sizing ([c574adc](https://github.com/pscedu/cpra-mp-ui/commit/c574adc6b858c50147e0842815caeef3b5f37185))
* **map:** look up coordinate vector IDs using crosswalk API endpoint ([19a7f73](https://github.com/pscedu/cpra-mp-ui/commit/19a7f735a8ca5ff70913282a5dff2353708dd1ac))
* preserve selection when changing between raster grids ([870b7d9](https://github.com/pscedu/cpra-mp-ui/commit/870b7d991deed6989cb2ec8be5122f12373f5e88))

## [0.4.0](https://github.com/pscedu/cpra-mp-ui/compare/v0.3.1...v0.4.0) (2026-06-24)


### Features

* **map:** add style params property ([846d8a9](https://github.com/pscedu/cpra-mp-ui/commit/846d8a9e6eec11e49fd68bc58f311ce0cc322d4c))

## [0.3.1](https://github.com/pscedu/cpra-mp-ui/compare/v0.3.0...v0.3.1) (2026-06-23)


### Bug Fixes

* **base-map:** fix reload when filters first change ([6ff2cc6](https://github.com/pscedu/cpra-mp-ui/commit/6ff2cc6282683b2d4a85eb61e660613a6e3ee4a3))
* **dimensions-select:** add missing key prop ([6c2ca5f](https://github.com/pscedu/cpra-mp-ui/commit/6c2ca5f86952b108ffed9cb6c3dfdbe7d7e4345f))
* **state:** hydrate catalog queries in providers ([d5bc774](https://github.com/pscedu/cpra-mp-ui/commit/d5bc77466676b31c1c86b048a8a2d2b4c193fac8))

## [0.3.0](https://github.com/pscedu/cpra-mp-ui/compare/v0.2.0...v0.3.0) (2026-06-08)


### Features

* **dimension-select:** allow manual choices ([8abfae0](https://github.com/pscedu/cpra-mp-ui/commit/8abfae05b1b64ca810a50412bdb78ceb51f29e80))


### Bug Fixes

* **base-map:** set map loading when style URL changes ([7541bd0](https://github.com/pscedu/cpra-mp-ui/commit/7541bd0158b85b978abddc71f3d1055905e32388))
* **time-select:** update filters after year input change ([0f502e8](https://github.com/pscedu/cpra-mp-ui/commit/0f502e80ac5817c8f6a5f4d6333abcf0603d097f))

## [0.2.0](https://github.com/pscedu/cpra-mp-ui/compare/v0.1.0...v0.2.0) (2026-06-04)


### Features

* **dataset-select:** add master plan filter ([3a0c2ab](https://github.com/pscedu/cpra-mp-ui/commit/3a0c2ab0a2b14c9166ffc194ea23dcfb1e976513))
* **map-legend:** use D3 to format difference legend labels ([8cc612b](https://github.com/pscedu/cpra-mp-ui/commit/8cc612ba7129389ff5f9d21d35e7f67dd41c9579))
* **tags:** add concern level to QA/QC tags ([4190646](https://github.com/pscedu/cpra-mp-ui/commit/419064684af4a8ec059f3bc5f9bcbcf95404ee1e))


### Bug Fixes

* **app-sidebar:** only show the download button on the data tab ([62cae87](https://github.com/pscedu/cpra-mp-ui/commit/62cae87b72ac37a55c4fb5a398cd434142c869db))
* **catalog:** fix time label lookup for decadal data ([62b1810](https://github.com/pscedu/cpra-mp-ui/commit/62b1810075884c96a1ca32631714775cca608c42))
* **issue-form:** change button text to Save ([1174f2b](https://github.com/pscedu/cpra-mp-ui/commit/1174f2bd59c1b4a161842861d864ee7a411b229b))
* **map:** fix setting map position on move ([a2d20b1](https://github.com/pscedu/cpra-mp-ui/commit/a2d20b1cad95a5666ae2169196921fcdaa02b8d7))

## 0.1.0 (2026-05-27)


### Features

* add components for login, logout, and avatars ([04b73a9](https://github.com/pscedu/cpra-mp-ui/commit/04b73a908491097e6e19c5e153c87e346ab3760f))
* add dataset selection ([50fe5c0](https://github.com/pscedu/cpra-mp-ui/commit/50fe5c0634157df8a6805293f24154860f9b01f5))
* allow multiple selection comparison ([1ecd714](https://github.com/pscedu/cpra-mp-ui/commit/1ecd714eb17bd714e90e588ddbed1e4bd2621f31))
* **auth:** refresh access tokens as needed ([97f8d8d](https://github.com/pscedu/cpra-mp-ui/commit/97f8d8d1c04f5f47faeed5fb864833005cc2d343))
* **auth:** save ClickUp account information ([7722808](https://github.com/pscedu/cpra-mp-ui/commit/7722808178c7355b6ec6c7dd5a28dca93662d547))
* **catalog:** implement difference queries ([8d9f9f2](https://github.com/pscedu/cpra-mp-ui/commit/8d9f9f2f12536673ad7331619f780cbe4ce63203))
* **comment-edit:** add permalink insertion ([cd2446e](https://github.com/pscedu/cpra-mp-ui/commit/cd2446e791becd5f2aeecfa0d70a890c61fdb591))
* **comment-edit:** allow custom placeholder ([84ef9f7](https://github.com/pscedu/cpra-mp-ui/commit/84ef9f7da343b68c5d1d3ae30e1f2fe78f5e1d59))
* **comment-edit:** improve default link labels ([99dc4c1](https://github.com/pscedu/cpra-mp-ui/commit/99dc4c1b1dcab57f43e5ea019623ef79279d986e))
* **comment-save-button:** add warning for missing links ([1e956c6](https://github.com/pscedu/cpra-mp-ui/commit/1e956c61a5912e19411efefdea54434e8f92bfb4))
* **comment:** add comment assignment ([0638bc1](https://github.com/pscedu/cpra-mp-ui/commit/0638bc106dc8e88f90b88a8beb9b66a3b38f0655))
* **comments:** allow comment editing ([507e093](https://github.com/pscedu/cpra-mp-ui/commit/507e0939a64812f8ce5b9c459d6b27e94c7a2e3d))
* **comment:** support links in comments ([ec20b59](https://github.com/pscedu/cpra-mp-ui/commit/ec20b595eeecbea0aa97f9a53f4a42b967662444))
* **config:** update API base URL ([23f9185](https://github.com/pscedu/cpra-mp-ui/commit/23f9185997187c891234b72cfbeb384949a8d42f))
* **data-sidebar:** use react-select ([44237f6](https://github.com/pscedu/cpra-mp-ui/commit/44237f673b8cc0552b44b20828747b5c3f9cbf8a))
* **dataset-select:** temporarily disable multiple variable selection ([409f1d4](https://github.com/pscedu/cpra-mp-ui/commit/409f1d470ebb4a1bda1f776e166bc2c1eb1d271d))
* **dimensions-select:** add dimension icons ([d3cd770](https://github.com/pscedu/cpra-mp-ui/commit/d3cd7705311baaf7d0276613ff92916e715c8f63))
* **dimensions-select:** add select fields for filter dimensions ([4184a21](https://github.com/pscedu/cpra-mp-ui/commit/4184a21708a5fa24e234b3f79acd702583316da7))
* **download:** add data download ([f450f85](https://github.com/pscedu/cpra-mp-ui/commit/f450f85c2622773cec4cca14ddc774151a1c3568))
* **edit-toggle:** click to edit ([e030f81](https://github.com/pscedu/cpra-mp-ui/commit/e030f81be2881596696aad6d0d0cab3f8d8fbdc1))
* export map legend control ([9dcb9f3](https://github.com/pscedu/cpra-mp-ui/commit/9dcb9f39c7b967462527be63b82a9f373f357bff))
* **hash:** always include map position in URL hash ([28bf94c](https://github.com/pscedu/cpra-mp-ui/commit/28bf94c20e2ae9e0fc907975017a5a38e53fed46))
* **hash:** enable browser back button ([19d74d0](https://github.com/pscedu/cpra-mp-ui/commit/19d74d0e30cdc65abad485b874903d6e5be0dddc))
* **hash:** sync datasets with URL hash ([a893a68](https://github.com/pscedu/cpra-mp-ui/commit/a893a68bba9091aa078dfee31813f38227863489))
* **hash:** sync filters with URL hash ([dfd460f](https://github.com/pscedu/cpra-mp-ui/commit/dfd460fb8595233d3c1538447d235af6ad3a3505))
* **hash:** sync map position with URL hash ([3e60e57](https://github.com/pscedu/cpra-mp-ui/commit/3e60e570c53189c037971866e32a987bd73d858b))
* **hash:** sync visualization type and geographies to URL hash ([a792c41](https://github.com/pscedu/cpra-mp-ui/commit/a792c415be934062fe80bd6cfae0b3f8ebe10af9))
* **issue-detail:** add ClickUp link ([6dda34e](https://github.com/pscedu/cpra-mp-ui/commit/6dda34e29089a3ba9851001e129f511e825a9642))
* **issue-detail:** add inline name editing ([0d32ccb](https://github.com/pscedu/cpra-mp-ui/commit/0d32ccb130cc67ecefe098542e97eda2b3ac79d1))
* **issues:** add assignees to detail view ([54b912f](https://github.com/pscedu/cpra-mp-ui/commit/54b912fb68693103a781f50f1f0ebe4389c7580e))
* **issues:** add comment form ([73e49d0](https://github.com/pscedu/cpra-mp-ui/commit/73e49d04112655c474bd69ff8e14ec4d72227a2c))
* **issues:** add comment form and show comments ([5facadb](https://github.com/pscedu/cpra-mp-ui/commit/5facadb6c6229540955d1df9a22e67451123e270))
* **issues:** add initial issue list and detail components ([b921882](https://github.com/pscedu/cpra-mp-ui/commit/b921882c97d2c1085489349efeb4c400e70102fe))
* **issues:** add issue creation form ([2eb5e55](https://github.com/pscedu/cpra-mp-ui/commit/2eb5e55a0d9a616128c07beb2c2fac6a6208e306))
* **issues:** add issue list ([c2e1142](https://github.com/pscedu/cpra-mp-ui/commit/c2e114256bfc1632cf30697ea7810cd5f7e35d73))
* **issues:** add QA/QC tags ([d44595a](https://github.com/pscedu/cpra-mp-ui/commit/d44595ab0089862c36424960ea0d93225fc142a8))
* **issues:** add quick select for required tag categories ([5da5059](https://github.com/pscedu/cpra-mp-ui/commit/5da5059735d6a9a81caa104ee4c8103e3560d0c4))
* **issues:** add tag editing ([e6116b7](https://github.com/pscedu/cpra-mp-ui/commit/e6116b7642ede771fbc37177e432cd2ff887a75c))
* **issues:** add warning if required QA/QC tags are missing ([5a2783f](https://github.com/pscedu/cpra-mp-ui/commit/5a2783f20f509c2715ab9c80dc1d48014e09d383))
* **issues:** allow filtering by tag ([a216375](https://github.com/pscedu/cpra-mp-ui/commit/a2163758d1d17a9c2b0fc0239001abd330694063))
* **issues:** auto-tag new issues with the current dimension values ([047637f](https://github.com/pscedu/cpra-mp-ui/commit/047637f9f86d72c31a3eacaf9a316345d5ba3bff))
* **issues:** filter by tag on click ([29b5654](https://github.com/pscedu/cpra-mp-ui/commit/29b56548733162b1ef8db217472fe4c80a988099))
* **issues:** initial work on issue form ([9ca99c0](https://github.com/pscedu/cpra-mp-ui/commit/9ca99c048c5ae04f36a3a76f719e1800f4d068c8))
* **issues:** load task statuses from management API ([db4bcd3](https://github.com/pscedu/cpra-mp-ui/commit/db4bcd3d2755e91070a95f38707e0e8890d776b2))
* **issues:** make assignees editable ([8b20316](https://github.com/pscedu/cpra-mp-ui/commit/8b2031647199453c8e7b81882f66e94126175208))
* **issues:** show avatars for creator and assignees ([6dc045d](https://github.com/pscedu/cpra-mp-ui/commit/6dc045dfae67e479aa327089c2b9972a1ee6355e))
* **library:** export TimeSelect and data atoms ([448a1cb](https://github.com/pscedu/cpra-mp-ui/commit/448a1cb20fb6386178069065239aa88ee5177ffc))
* **management:** get user information in separate request ([109f219](https://github.com/pscedu/cpra-mp-ui/commit/109f219adf8a1224a18b8951a43641a1099f4e77))
* **map-context-menu:** base batch rotation on visualization max ([4afeec1](https://github.com/pscedu/cpra-mp-ui/commit/4afeec1d6bb01ff0eb5abcf814c93cea9eb719e2))
* **map-page:** add error boundaries ([52e746f](https://github.com/pscedu/cpra-mp-ui/commit/52e746f4b040356cdc3c9df927dd86c00d7d84e1))
* **map-sidebar:** add sidebar component with tabs ([a939931](https://github.com/pscedu/cpra-mp-ui/commit/a9399313b692ea83deda9785ef9f5cf3df49ffb4))
* **map:** add context menu components ([6d52774](https://github.com/pscedu/cpra-mp-ui/commit/6d527749b163f7886c5ba3bda1e1260f8f8baa95))
* **map:** add difference color ramp for vector grids ([a4c5034](https://github.com/pscedu/cpra-mp-ui/commit/a4c5034fad35750f147f51b61ee1296dffa676b2))
* **map:** add map component and basic raster style ([037b872](https://github.com/pscedu/cpra-mp-ui/commit/037b8726b683f817319acc4583fe51e7f62a9a7f))
* **map:** add map legend ([f0e5d2b](https://github.com/pscedu/cpra-mp-ui/commit/f0e5d2b7f097771649ffdc7fd90f2c78a89e3ebf))
* **map:** add map options menu ([afd32f0](https://github.com/pscedu/cpra-mp-ui/commit/afd32f0473a0aec1860033c03591e62e273e8f2d))
* **map:** add option to show/hide grid lines ([5bf626f](https://github.com/pscedu/cpra-mp-ui/commit/5bf626ffbb6f5ee2d6a84b2f649539a6be42e8e8))
* **map:** add project layers ([e39da95](https://github.com/pscedu/cpra-mp-ui/commit/e39da95d4a296361bbd96019096590af52e401af))
* **map:** add selection context menu ([78f7988](https://github.com/pscedu/cpra-mp-ui/commit/78f7988202a4d7ce824f4b0a8cf93a3c539897e3))
* **map:** add selection keyboard shortcuts ([ff4bd17](https://github.com/pscedu/cpra-mp-ui/commit/ff4bd176126e8bae0f2c7ac91801797da10e843c))
* **map:** add support for dragging markers ([6c821a4](https://github.com/pscedu/cpra-mp-ui/commit/6c821a41f85e6f8271a193cefe70efa724b48d10))
* **map:** add support for land change concatenation ([497e359](https://github.com/pscedu/cpra-mp-ui/commit/497e359a8d9eec293e11de9bcf14981a74d5f743))
* **map:** add support for per-variable difference limit ([38f8af6](https://github.com/pscedu/cpra-mp-ui/commit/38f8af6895531e60606b91d831070b1ca5e5743c))
* **map:** add support for raster geography selection ([dec8347](https://github.com/pscedu/cpra-mp-ui/commit/dec83476de11f6d0d1f33d5500101838bd94e65c))
* **map:** add support for water overlay ([257af3a](https://github.com/pscedu/cpra-mp-ui/commit/257af3a8fa269504250cb52376f7e3ccd548ae92))
* **map:** add toggle for water overlay ([f2e8dca](https://github.com/pscedu/cpra-mp-ui/commit/f2e8dcaf5ad3afea420189241ded8859c436bca2))
* **map:** add vector geography selection ([ece3a4d](https://github.com/pscedu/cpra-mp-ui/commit/ece3a4d6b0572e5111316463a76ed2e67b17056c))
* **map:** base selection color on visualization max geographies ([142b3e0](https://github.com/pscedu/cpra-mp-ui/commit/142b3e076ee2ccd127efdf996ede3c672cb330a3))
* **map:** get map style from the API ([5541c98](https://github.com/pscedu/cpra-mp-ui/commit/5541c983b6a737dc7f730e26e8d680f8335b547a))
* **map:** handle changes between concatenate and other analysis types ([4960859](https://github.com/pscedu/cpra-mp-ui/commit/49608592d6a9e822ed2a89e934f41250ff99366c))
* **map:** load data for vector grids ([71a9760](https://github.com/pscedu/cpra-mp-ui/commit/71a976080f4a9ae1f56b088e97b4e98f0e64ad0e))
* **map:** load projects from MPD ([a23f008](https://github.com/pscedu/cpra-mp-ui/commit/a23f008d5385ba930365db6ebcb62c05a00f6716))
* **map:** optimize style updates ([459e455](https://github.com/pscedu/cpra-mp-ui/commit/459e455e12ccf8ff38194eb05c36c428057345db))
* **mapstyle:** display vector geometry outlines ([5d1f703](https://github.com/pscedu/cpra-mp-ui/commit/5d1f703e5092c50723311c3d308a3baf954004df))
* **mapstyle:** do not promote ID fields in vector sources ([990b34d](https://github.com/pscedu/cpra-mp-ui/commit/990b34dd5a9c32a7e48183474f9558ab3d0c388b))
* **map:** use transparent as the zero color for raster difference ([aecfbbc](https://github.com/pscedu/cpra-mp-ui/commit/aecfbbc964c3f0b71fc5574432f7a272dfe5ec65))
* **markdown:** add markdown support to task descriptions ([156735c](https://github.com/pscedu/cpra-mp-ui/commit/156735cfb8fcb79087c89c6e8624408b43cf8959))
* **multi-select:** temporarily limit to single selection ([06267da](https://github.com/pscedu/cpra-mp-ui/commit/06267daa3ed9c324d6bcd4e2b4062baed1ec0b26))
* **rselect:** add icon support ([1d9eef3](https://github.com/pscedu/cpra-mp-ui/commit/1d9eef3a20ed20862d88e6121d566f9cfeb3dab4))
* **rselect:** add title for long options ([e75123e](https://github.com/pscedu/cpra-mp-ui/commit/e75123eecfc50ce01cd3452c22ee39808a062fec))
* **rselect:** set background color in dark mode ([d4e5d3b](https://github.com/pscedu/cpra-mp-ui/commit/d4e5d3bb70918fce1477c5d268517fe45bab7c93))
* **scope-data-provider:** add scope data provider ([c9fafa8](https://github.com/pscedu/cpra-mp-ui/commit/c9fafa8810a14bb20b26ca2259ffe2c5be1bbe09))
* **selection-mode-dropdown:** add selection mode dropdown ([538fc6a](https://github.com/pscedu/cpra-mp-ui/commit/538fc6ad6bb3445b0a72a599424ba473f8dbb14d))
* **selection-mode-dropdown:** disable menu when only one option is ([6c48c63](https://github.com/pscedu/cpra-mp-ui/commit/6c48c6331699dc83d838ed15c7957e0fd093f51a))
* **selection-mode-dropdown:** temporarily disable compare option ([8a05336](https://github.com/pscedu/cpra-mp-ui/commit/8a05336868565c57946f345551947dfdabc2883c))
* **sidebar-select:** add label to menu ([d0ac0da](https://github.com/pscedu/cpra-mp-ui/commit/d0ac0da997ce4c86591754eeff7ca4aced678064))
* **sidebar:** increase width and allow collapse via button ([cfc7ffb](https://github.com/pscedu/cpra-mp-ui/commit/cfc7ffbae0b5e24c6af2c1dd88f8bf7394e02779))
* **state:** add support for raster coordinates in selected geographies ([8e81c8e](https://github.com/pscedu/cpra-mp-ui/commit/8e81c8e9248c63c55f71daff1204fe59a39559a3))
* **state:** gracefully handle changes in time unit ([96e84cb](https://github.com/pscedu/cpra-mp-ui/commit/96e84cb510dda8bcdafec83c88b855f4a615e74b))
* **state:** reload user information on application load ([8a25472](https://github.com/pscedu/cpra-mp-ui/commit/8a254722003842ef0d791d78ddf62fb6db91f9cc))
* **state:** reset selected geographies when the grid changes ([296f4b0](https://github.com/pscedu/cpra-mp-ui/commit/296f4b018ec348c571c7564f9b6d597f402d7ef4))
* **state:** send query parameters to catalog ([4f51507](https://github.com/pscedu/cpra-mp-ui/commit/4f51507f44f796370ad196cb8d26fecd4dcb711c))
* **status-select:** make issue status editable ([e9832ff](https://github.com/pscedu/cpra-mp-ui/commit/e9832ff1ab8ca2ee9b07f6312e06eb420e6d5b7b))
* **structure:** add visualization type data from API ([e25a029](https://github.com/pscedu/cpra-mp-ui/commit/e25a029e23ec2df282ca31226a398637774d9792))
* **structure:** enable daily datasets ([2e5d170](https://github.com/pscedu/cpra-mp-ui/commit/2e5d1706f0677f725591d3d1de1ada0b76e28949))
* **structure:** enable monthly and decadal data ([34ec75f](https://github.com/pscedu/cpra-mp-ui/commit/34ec75f62de92215cb4c86f79dbb1abe8191c4d5))
* **time-select:** add date/year edit form ([2a3dab4](https://github.com/pscedu/cpra-mp-ui/commit/2a3dab4c931f3c947143508a09464bb462eba960))
* **time-select:** add selection mode dropdown ([b905afb](https://github.com/pscedu/cpra-mp-ui/commit/b905afb09f6f147856637f2befff33e4278b0d22))
* **time-select:** add time slider ([33ddda9](https://github.com/pscedu/cpra-mp-ui/commit/33ddda9add373e7de449049a51f91b007839e636))
* **time-select:** disable dates that are not in choices ([2100767](https://github.com/pscedu/cpra-mp-ui/commit/210076780881047c26d0e641bc142245cea074ad))
* **time-select:** replace react-range with shadcn/ui slider ([cd2d10e](https://github.com/pscedu/cpra-mp-ui/commit/cd2d10e79b5dafca2fc294ee8620364eeeb8273a))
* **time-select:** shorten catalog query delay ([720601e](https://github.com/pscedu/cpra-mp-ui/commit/720601eb634c30633811439042b9d0684cd20108))
* **time-select:** show multiple calendars if needed ([1755f9e](https://github.com/pscedu/cpra-mp-ui/commit/1755f9eceafbec5218a4f95b96bb5507cf08868f))
* **utils:** add function to extract compressed values ([4b81953](https://github.com/pscedu/cpra-mp-ui/commit/4b8195315a6a00c10b18d1bdc98523ab8bfba759))
* **visualization:** add select and sidebar components ([1f48ffa](https://github.com/pscedu/cpra-mp-ui/commit/1f48ffa8abadc3fe307f87da40943c489c6e0bac))
* **visualization:** add visualization and visualization panel ([c180105](https://github.com/pscedu/cpra-mp-ui/commit/c1801057612ea76ac15c2d0d63035181d9b40d7c))
* **visualization:** delay loading spec JSON on resize ([caaae7b](https://github.com/pscedu/cpra-mp-ui/commit/caaae7b3364445b74193f7bc60eb4b556adc94ee))
* **visualization:** expose chart for use in other React projects ([c0eed3e](https://github.com/pscedu/cpra-mp-ui/commit/c0eed3ed5b364adffab119e2a3af2cbce80abb9b))
* **visualization:** preserve start and end dates ([8c71900](https://github.com/pscedu/cpra-mp-ui/commit/8c719003593072487ccd4a2cefd3ea146547bf5d))
* **visualization:** resize Vega chart to fit ([b38cd57](https://github.com/pscedu/cpra-mp-ui/commit/b38cd5768458631b2986d10d4fa9a6ba4fa25d38))
* **worker-page:** improve formatting ([2ae59f5](https://github.com/pscedu/cpra-mp-ui/commit/2ae59f527976953088af3d468ec128cb81732ac9))


### Bug Fixes

* **assignees-select:** only show users who have linked a ClickUp account ([ce71ba2](https://github.com/pscedu/cpra-mp-ui/commit/ce71ba2862e85f8cb0631fb18dfde61018f9ea03))
* **auth:** fix display of login error ([6986f06](https://github.com/pscedu/cpra-mp-ui/commit/6986f06bde88532cbdc87ff7b62fe25982e97e8f))
* **base-map:** fix error when bounds object is empty ([20640f7](https://github.com/pscedu/cpra-mp-ui/commit/20640f723839838277baa0febbbf50fe73c7e736))
* **catalog:** check for valid subtraction dimension ([1168520](https://github.com/pscedu/cpra-mp-ui/commit/1168520ce49389d1d2b4e506c1f5170f1aed8040))
* **color-chooser-menu-items:** use local state ([6ac4a29](https://github.com/pscedu/cpra-mp-ui/commit/6ac4a297a2cf08effddf174e6b5a4e55eb5f9002))
* **comment-edit:** add missing parameters to map links ([12aacdd](https://github.com/pscedu/cpra-mp-ui/commit/12aacdd5a953dfec32bb45cc437656d8acbce53e))
* **comment:** fix error from missing assignee ([03f1ff9](https://github.com/pscedu/cpra-mp-ui/commit/03f1ff96d10adb8e423a44edeaf53542926345ec))
* **dataset-select:** try to keep variables when changing time units ([e7a0de9](https://github.com/pscedu/cpra-mp-ui/commit/e7a0de9d8ece247d9ead233f164d586224206ced))
* **dimensions:** show selects for dimensions with defined values ([3db1dbb](https://github.com/pscedu/cpra-mp-ui/commit/3db1dbbf00c273745fb567d4c05cf52d011227a1))
* fix login and task loading ([3716752](https://github.com/pscedu/cpra-mp-ui/commit/3716752fb43e21c9c2704afeddb88094a99d8d18))
* fix task loading and editing ([4fad801](https://github.com/pscedu/cpra-mp-ui/commit/4fad80166cc873ac21f8018a88be0fa00d398db5))
* **hash:** exclude quotes when encoding string params ([9514b4a](https://github.com/pscedu/cpra-mp-ui/commit/9514b4a67a1bd621c71a89c8353ba85b349fe8c1))
* **hash:** fix back button behavior ([8448c06](https://github.com/pscedu/cpra-mp-ui/commit/8448c06338c63641d4a8ac98190103cd898cef49))
* **hash:** get fresh params before updating signals ([2070ba4](https://github.com/pscedu/cpra-mp-ui/commit/2070ba4ad151efb3062f9023e4ada4ae9ac60ee3))
* **hash:** reflect all filter parameters to URL hash ([24d512a](https://github.com/pscedu/cpra-mp-ui/commit/24d512af7502f89caff6aee7d282f0c97f9ab74e))
* **hash:** use dash as field separator ([93da288](https://github.com/pscedu/cpra-mp-ui/commit/93da288630eb91d21ea2ead7283436628a6cbc79))
* **issue-detail:** add space around no data labels ([972c7c4](https://github.com/pscedu/cpra-mp-ui/commit/972c7c4b7995c7f609f0483362c5fab49c533964))
* **issue-detail:** fix tags attribute ([58c28b3](https://github.com/pscedu/cpra-mp-ui/commit/58c28b30f3051d1f0275063dfebc504170d0dd44))
* **issue-form:** fix auto-tagging with data dimensions ([ea138d7](https://github.com/pscedu/cpra-mp-ui/commit/ea138d793296908f7a70f938ac6d74e8c79a3268))
* **issues:** clear task signal after task creation ([d75934d](https://github.com/pscedu/cpra-mp-ui/commit/d75934d8088e2ad16309c5b549c3ea5de32f5598))
* **issues:** rename issues to observations ([38d8b21](https://github.com/pscedu/cpra-mp-ui/commit/38d8b218b84ef8957dd753968745c6768a09c6d0))
* **issues:** use add/rem format for assignees update ([dd2a6b9](https://github.com/pscedu/cpra-mp-ui/commit/dd2a6b9f3e650ef56a87ed305f5d5a7a66c55a1b))
* **library:** make Jotai and related modules peer dependencies ([a0b54d1](https://github.com/pscedu/cpra-mp-ui/commit/a0b54d1b994bb87c2805dc56f28b08d9a4fd89de))
* make task suspend while loading ([0f14908](https://github.com/pscedu/cpra-mp-ui/commit/0f14908d046a14116b00d0b6e7963b5967cecd8e))
* **map-page:** temporarily hide sidebar trigger button ([44ce64a](https://github.com/pscedu/cpra-mp-ui/commit/44ce64aea6236627848d623ffed7f494f102e462))
* **map:** add a new layer when the dataset changes ([3deff5b](https://github.com/pscedu/cpra-mp-ui/commit/3deff5b59c954ef54c1ea04f3c5bc2ec41130cae))
* **map:** add legend plugin on map init ([022bbdb](https://github.com/pscedu/cpra-mp-ui/commit/022bbdb6d237229a3db013945379342b7adec771))
* **map:** convert feature IDs to integers ([e137cbe](https://github.com/pscedu/cpra-mp-ui/commit/e137cbe300ea84e0d36900b249c07f698c42f34d))
* **map:** fix context menu location for markers ([0a6a017](https://github.com/pscedu/cpra-mp-ui/commit/0a6a01749d63bb528b7bf4a799c9409b33ccc049))
* **map:** fix handling of zoom and center ([9d2e98f](https://github.com/pscedu/cpra-mp-ui/commit/9d2e98fadb306c3f3c9c5a64525e14e3d7e2f3e5))
* **map:** fix missing or duplicate map legend ([eb218de](https://github.com/pscedu/cpra-mp-ui/commit/eb218de58667a843687bb12bae65796dcd6e221e))
* **map:** fix stale values in event handlers ([9de74fa](https://github.com/pscedu/cpra-mp-ui/commit/9de74fa67b72a208b7d56244c81746dcdb5ef59a))
* **map:** fix time-based difference ([5f89565](https://github.com/pscedu/cpra-mp-ui/commit/5f8956546d5b6ab1a6b25d3dc32f64b7a4ede7fb))
* **map:** fix type errors ([636553d](https://github.com/pscedu/cpra-mp-ui/commit/636553da47fc7149b6de8b87b9e136bfb73090ba))
* **map:** fix typo in difference detection ([58a4652](https://github.com/pscedu/cpra-mp-ui/commit/58a46522d21b6f221b383cc8e3b1867b269eab7b))
* **map:** handle multiple model groups or scenarios in water overlay ([f39536f](https://github.com/pscedu/cpra-mp-ui/commit/f39536f60df12dfb7c447450cb3201f828d7bbe8))
* **map:** make map selection work with subtraction ([09e644f](https://github.com/pscedu/cpra-mp-ui/commit/09e644fbe802c60494f48c9571c98794069e5e7d))
* **map:** prevent map re-init when visualization changes ([a5366ed](https://github.com/pscedu/cpra-mp-ui/commit/a5366ed63983198ba7d71ea91b39b155eaf1761a))
* **map:** set grid label in context menu ([500eb55](https://github.com/pscedu/cpra-mp-ui/commit/500eb55ab905adbc6164657b3eb27d487c68654c))
* **map:** use project type code for symbology ([a616f8d](https://github.com/pscedu/cpra-mp-ui/commit/a616f8da059464c4865f95f475bd97a8a575d55d))
* **map:** wait for source to load before setting feature state ([a31c279](https://github.com/pscedu/cpra-mp-ui/commit/a31c2795687c1886cae7c83d56a5dffeba729eb6))
* **nav-user:** fix ClickUp account linking ([aeed777](https://github.com/pscedu/cpra-mp-ui/commit/aeed7772b3fa66b6e49a6858c612e1e9fbc5d04f))
* **portal:** remove unused import ([158db37](https://github.com/pscedu/cpra-mp-ui/commit/158db37f886528059f56e0d8d1b2e25a8f3391d2))
* **rselect:** limit options to one line ([f484067](https://github.com/pscedu/cpra-mp-ui/commit/f484067519e5243c511dc308ff7b22e081c8cf51))
* **scope-data-provider:** add missing atoms and effects ([214701a](https://github.com/pscedu/cpra-mp-ui/commit/214701a335bbcbe56de0b0b5502c6b52932207eb))
* **selection-mode-dropdown:** fix options logic ([7fa08b2](https://github.com/pscedu/cpra-mp-ui/commit/7fa08b2d09c8ac7856c26cc243bbfcd94803a9ba))
* **state:** change analysis dimension when time unit changes ([22e2957](https://github.com/pscedu/cpra-mp-ui/commit/22e2957d4c9d03bbe77d859cdafca3fbfe72cdb9))
* **state:** don't subtract time dimension in visualizations ([8b338ea](https://github.com/pscedu/cpra-mp-ui/commit/8b338ea6b949601f973f0bd0bd28e2d85e9dcda3))
* **state:** update Jotai dependencies to use compatible versions ([70d5922](https://github.com/pscedu/cpra-mp-ui/commit/70d5922b3150270c097a590cdd4cc2e861c45a73))
* **status-select:** fix state update after save ([a26525f](https://github.com/pscedu/cpra-mp-ui/commit/a26525ff14d1871e0a9b2cfa07ad8ffe7fc31262))
* **structure:** ignore datasets with invalid variables or grids ([49d762b](https://github.com/pscedu/cpra-mp-ui/commit/49d762b882b48ffd8f8432a9c9b65d87a1aeae9f))
* **structure:** temporarily hide decadal and monthly datasets ([c223833](https://github.com/pscedu/cpra-mp-ui/commit/c223833361ce67ba830c2b3d46af9ab08244d010))
* **structure:** use catalog query results in data label ([0626432](https://github.com/pscedu/cpra-mp-ui/commit/0626432da5620e5d436663c46d81e40c69bb8d0e))
* **structure:** use default legend for new variables ([47ace04](https://github.com/pscedu/cpra-mp-ui/commit/47ace045439faa95b2615bd7bd6f2145c6b53cc7))
* **tag-token:** fix error for unknown categories ([176a378](https://github.com/pscedu/cpra-mp-ui/commit/176a37868b57f79dcb6cd4e0424ed2260b2f14d6))
* **tags:** fix label for non-dimension tags ([a6a19a5](https://github.com/pscedu/cpra-mp-ui/commit/a6a19a5499c7bb474c80206b625e118a14268c9e))
* **tags:** make all tag values lowercase ([e033f02](https://github.com/pscedu/cpra-mp-ui/commit/e033f02c23c1250218e60227d499eec3528bdd7c))
* **time-select:** add key to calendars ([abe3391](https://github.com/pscedu/cpra-mp-ui/commit/abe3391df367a3c17895a1f4c10711977177c755))
* **time-select:** fix error when there is only one time choice ([1e51481](https://github.com/pscedu/cpra-mp-ui/commit/1e514810ba22e2a68031a3052322765db9ca74a6))
* **time-select:** fix year combobox ([41f3e7f](https://github.com/pscedu/cpra-mp-ui/commit/41f3e7f42243d5467ff90b1c669629563a1c9e90))
* **utils:** fix extraction of monthly and decadal time values ([3fa7ce7](https://github.com/pscedu/cpra-mp-ui/commit/3fa7ce769e602239085c5be94cb42b7d7bb652e9))
* **utils:** prevent error if string to title case is null or undefined ([771e71a](https://github.com/pscedu/cpra-mp-ui/commit/771e71ae3dddebac5dd6223221652910e919f79c))
* **visualization-select:** hide map option ([8f3edd8](https://github.com/pscedu/cpra-mp-ui/commit/8f3edd8060359fe875a82f1793f1bb17ec2fb3bc))
* **visualization-select:** show selected value ([7044ff5](https://github.com/pscedu/cpra-mp-ui/commit/7044ff59f6796f32e2603ad4ab44dab9dc146818))
* **visualization-sidebar:** hide sidebar until choices are loaded ([a2510b6](https://github.com/pscedu/cpra-mp-ui/commit/a2510b63546d6614dbd58327f93d6b45b29f95f4))
* **visualization-type:** fix select props ([18f61e1](https://github.com/pscedu/cpra-mp-ui/commit/18f61e1c434c33a19a66c8e6a1fc400edcb2b34a))


### Performance Improvements

* **state:** remove unnecessary status from task PUT ([3e47bd6](https://github.com/pscedu/cpra-mp-ui/commit/3e47bd64ded4568890ce510ac66f89555861482c))


### Miscellaneous Chores

* release 0.1.0 ([13e1bd3](https://github.com/pscedu/cpra-mp-ui/commit/13e1bd3a799f3d2e4893d30eb115b1052aa3ea8f))
