# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.10.0] - 2020-06-29

### Changed

+ Updated the hydrus API version to `13`

## [1.9.0] - 2020-06-17

### Changed

+ Updated the hydrus API version to `12`

## [1.8.0] - 2020-05-22

### Changed

+ Maintenance release, no feature changes

## [1.7.0] - 2020-04-22

### Added

+ Added more log output about the currently worked on file

### Changed

+ Updated dependencies

## [1.6.0] - 2020-03-07

### Changed

+ Updated dependencies

### Fixed

+ Corrected the inability to extract large archives by using a stream instead
  of a buffer

## [1.5.1] - 2020-01-23

### Fixed

+ Errors occuring during navigation to the download page are now handled

## [1.5.0] - 2020-01-22

### Added

+ Added the ability to add a special identifier tag to uniquely determine the
  position of an image inside an archive

### Changed

+ Updated dependencies

## [1.4.0] - 2020-01-12

### Removed

+ Removed the ability to define custom UID and GID for the Docker container at
  container creation due to several issues arising from that

## [1.3.1] - 2020-01-07

### Fixed

+ Fixed access control headers not being added after restana upgrade

## [1.3.0] - 2020-01-07

### Added

+ Added the ability to define custom UID and GID for the Docker container at
  container creation

### Changed

+ Updated dependencies

## [1.2.0] - 2019-12-26

### Changed

+ Adjusted the workaround implemented for the discrepancy between the
  `/add_urls/associate_url` and `/add_urls/get_url_files` routes so it makes
  sure the normalized URL does not end with a `/`

### Fixed

+ Added missing example namespace replacements to Docker Compose example
  configuration

## [1.1.0] - 2019-12-24

### Added

+ Added additional example namespace replacements
+ Added the ability to skip adding tags

### Changed

+ Reworked API and made settings overridable
+ Updated and expanded userscript
+ Updated dependencies

### Fixed

+ Fixed error when not providing `HEX_DOCKER_HOST_IMPORT_PATH`
+ Added a workaround for the discrepancy between the `/add_urls/associate_url`
  and `/add_urls/get_url_files` hydrus API routes in regards to normalization

## [1.0.1] - 2019-12-19

### Fixed

+ Removed unnecessary Travis CI configuration

## 1.0.0 - 2019-12-19

### Added

+ Initial release

[Unreleased]: https://github.com/imtbl/hex/compare/1.10.0...develop
[1.10.0]: https://github.com/imtbl/hex/compare/1.9.0...1.10.0
[1.9.0]: https://github.com/imtbl/hex/compare/1.8.0...1.9.0
[1.8.0]: https://github.com/imtbl/hex/compare/1.7.0...1.8.0
[1.7.0]: https://github.com/imtbl/hex/compare/1.6.0...1.7.0
[1.6.0]: https://github.com/imtbl/hex/compare/1.5.1...1.6.0
[1.5.1]: https://github.com/imtbl/hex/compare/1.5.0...1.5.1
[1.5.0]: https://github.com/imtbl/hex/compare/1.4.0...1.5.0
[1.4.0]: https://github.com/imtbl/hex/compare/1.3.1...1.4.0
[1.3.1]: https://github.com/imtbl/hex/compare/1.3.0...1.3.1
[1.3.0]: https://github.com/imtbl/hex/compare/1.2.0...1.3.0
[1.2.0]: https://github.com/imtbl/hex/compare/1.1.0...1.2.0
[1.1.0]: https://github.com/imtbl/hex/compare/1.0.1...1.1.0
[1.0.1]: https://github.com/imtbl/hex/compare/1.0.0...1.0.1
