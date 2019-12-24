# hex [![Docker Hub build][docker-hub-badge]][docker-hub]

> A hydrus API plugin to download ExH archives

hex is a tool that connects to the [hydrus][hydrus] client API and allows you
to download and import ExH galleries via the archive download method (instead
of scraping the images), alongside their tags and URL association.

A simple HTTP API allows you to send gallery URLs to hex that it will then
proceed to download and import automatically. A [userscript](hex.user.js) that
adds a _hex Download_ button to ExH gallery pages is included for convenience.

## Table of contents

+ [Install](#install)
  + [Installing with Docker](#installing-with-docker)
  + [Installing without Docker](#installing-without-docker)
  + [Dependencies](#dependencies)
  + [Updating](#updating)
    + [Updating with Docker](#updating-with-docker)
    + [Updating without Docker](#updating-without-docker)
+ [Usage](#usage)
  + [Running with Docker](#running-with-docker)
  + [Running without Docker](#running-without-docker)
  + [Configuration](#configuration)
  + [Userscript](#userscript)
+ [Maintainer](#maintainer)
+ [Contribute](#contribute)
+ [License](#license)

## Install

The recommended way to run is via [Docker][docker]. Basic instructions on how
to run without it are also provided.

### Installing with Docker

To use hex with Docker, you can simply pull the prebuilt image from
[Docker Hub][docker-hub]:

```zsh
user@local:~$ docker pull mserajnik/hex
```

Alternatively, you can also build the image yourself. The user that is used
inside the container when the script is run has UID `1000` and GID `1000` by
default. You might want to adjust this by providing the arguments
`HOST_USER_ID` and `HOST_GROUP_ID` when making a build in case you run into
permission issues when the script tries to delete media.

### Installing without Docker

To install without Docker, you can simply clone the repository and install
dependencies.

```zsh
user@local:~$ git clone https://github.com/mserajnik/hex.git
user@local:~$ cd hex
user@local:hex$ yarn
```

### Dependencies

+ [hydrus][hydrus]
+ [Docker][docker] (when using Docker)
+ [Node.js][node-js] (when not using Docker)
+ [Yarn][yarn] (when using Docker)
+ A [Puppeteer][puppeteer]-compatible browser that hex uses for navigating and
  parsing ExH; [browserless][browserless] is recommended as a headless solution

hex should work with both the latest LTS and the latest stable version of
Node.js. If you encounter any issues with either of those versions when not
using Docker, please [let me know][issues].

### Updating

This script follows [semantic versioning][semantic-versioning] and any breaking
changes that require additional attention will be released under a new major
version (e.g., `2.0.0`). Minor version updates (e.g., `1.1.0` or `1.2.0`) are
therefore always safe to simply install.

When necessary, this section will be expanded with upgrade guides for new major
versions.

#### Updating with Docker

Simply pull the latest Docker image to update:

```zsh
user@local:~$ docker pull mserajnik/hex
```

#### Updating without Docker

If you chose not to use Docker, you can update via Git:

```zsh
user@local:hex$ git pull
user@local:hex$ yarn
```

## Usage

hex has a few specific requirements that you need to keep in mind in order to
use it, regardless of if you decide to run with or without Docker:

+ It requires a [Puppeteer][puppeteer]-compatible browser that is used for
  navigating and parsing ExH; [browserless][browserless] is recommended as a
  headless solution and used in the included [Docker Compose][docker-compose]
  example setup.
+ hex needs access to the hydrus client API. The access key needs to have the
  following permissions: `import files`, `add tags to files` and
  `add urls for processing`.
+ The import path needs to be accessible by both hex and hydrus, so you need to
  find a way to achieve this should you decide to run hex on a different
  machine.

### Running with Docker

To make using Docker as easy as possible, a working
[Docker Compose][docker-compose] example setup is provided. To get started with
this example setup, simply duplicate `docker-compose.yml.example` as
`docker-compose.yml` and adjust the variables in the `environment` section as
described [here](#configuration).

Pay special attention to the variable `HEX_DOCKER_HOST_IMPORT_PATH`. This is
only required when using Docker and needs to contain the __absolute__ path to
the import directory on the host machine that is mounted as volume. This is the
path hydrus will access to import the files from when hex asks it
to.

Finally, start the containers:

```zsh
user@local:hex$ docker-compose up -d
```

### Running without Docker

To run without Docker, you will first need to duplicate the `.env.example` as
`.env` and adjust the variables as described [here](#configuration).

After that, you can start hex:

```zsh
user@local:hex$ yarn start
```

### Configuration

Configuration is done entirely via environment variables. Please pay special
attention to the instructions to prevent issues.

+ `HEX_PORT=8000`: the port hex is listening on.
+ `HEX_ACCESS_KEY=`: an arbitrary string used as access key for hex's API. Can
  be of any (reasonable) length, the only requirement being that it is set at
  all.
+ `HEX_BROWSER_WS_ENDPOINT=ws://localhost:3000`: the WebSocket endpoint of the
  [Puppeteer]-compatible browser hex needs to be able to connect to. __No__
  __trailing slashes.__
+ `HEX_HYDRUS_BASE_URL=http://localhost:45869`: the hydrus client API base URL.
  __No trailing slashes.__
+ `HEX_HYDRUS_ALLOW_NEWER_API_VERSION=false`: setting this to `true` allows hex
  to connect to a newer hydrus client API versions than it officially supports.
  Enable this on your own risk to (possibly) be able to continue using hex if
  the hydrus API gets updated and a new hex release that reflects this is not
  out yet. Be aware that this can lead to hex not working at all or imports
  getting (partially) broken.
+ `HEX_HYDRUS_ACCESS_KEY=`: the hydrus client API access key hex uses to
  connect. Needs to have the following permissions: `import files`,
  `add tags to files` and `add urls for processing`.
+ `HEX_HYDRUS_TAG_SERVICE=my tags`: the hydrus tag service hex adds tags to.
+ `HEX_SKIP_IMPORT=false`: setting this to `true` downloads the archive and
  extracts it, but skips the hydrus import altogether.
+ `HEX_IMPORT_PATH=./import`: the path hex saves archive downloads at and
  extracts them in. Can be relative or absolute.
+ `HEX_DOCKER_HOST_IMPORT_PATH=`: only required when using Docker and needs to
  contain the __absolute__ path to the import directory on the host machine
  that is mounted as volume. The path has to be in a format your host operating
  system supports.
+ `HEX_SKIP_KNOWN_FILES=false`: setting this to `true` skips files hydrus knows
  about altogether (this will neither try to import them nor attempt to update
  their tags).
+ `HEX_DELETE_ARCHIVES_AFTER_IMPORT=true`: setting this to `false` will cause
  the extracted archives stored under `HEX_IMPORT_PATH` not to be deleted once
  the hydrus import finishes.
+ `HEX_SKIP_TAGS=false`: setting this to `true` will prevent any new tags from
  being added to imported files and disregards any other tag-related settings.
+ `HEX_BLACKLISTED_NAMESPACES=`: namespaces that are added here separated with
  `###` will be excluded from getting added to hydrus. E.g.,
  `artist###language###misc`. This only applies to tags sourced from ExH and
  the special `page:<page number>` tag that is added by default, not to tags
  added via `HEX_ADDITIONAL_TAGS`. In addition, if `HEX_NAMESPACE_REPLACEMENTS`
  is used and the replacement (but not the original) is a blacklisted
  namespace, it will still be added as well.
+ `HEX_NAMESPACE_REPLACEMENTS='artist|||creator###parody|||series###female|||###male|||###group|||###misc|||'`:
  namespaces that are added here in the format `<original>|||<replacement>` and
  separated with `###` will be replaced accordingly. Leaving out the
  replacement altogether (e.g., `###misc|||`) _unnamespaces_ them.
+ `HEX_ADDITIONAL_TAGS=`: additional tags to be added. Have to be provided in
  the format `<namespace>:<tag>` or simply `<tag>` (for unnamespaced tags) and
  separated with `###`.

### Userscript

To make using hex as comfortable as possible, a [userscript](hex.user.js) that
adds a _hex Download_ button to ExH gallery pages is included. Simply adjust
lines 6 and 7 with with the base URL of your hex API and the `HEX_ACCESS_KEY`
you chose.

## Maintainer

[mserajnik][maintainer]

## Contribute

You are welcome to help out!

[Open an issue][issues] or submit a pull request.

## License

[AGPLv3](LICENSE) © Michael Serajnik

[hydrus]: http://hydrusnetwork.github.io/hydrus
[docker]: https://www.docker.com/
[docker-hub]: https://hub.docker.com/r/mserajnik/hex/
[node-js]: https://nodejs.org/en/
[yarn]: https://yarnpkg.com/
[puppeteer]: https://pptr.dev/
[browserless]: https://github.com/browserless/chrome
[semantic-versioning]: https://semver.org/
[docker-compose]: https://docs.docker.com/compose/

[docker-hub-badge]: https://img.shields.io/docker/cloud/automated/mserajnik/hex.svg

[maintainer]: https://github.com/mserajnik
[issues]: https://github.com/mserajnik/hex/issues/new
