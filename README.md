# Have parcel turn svg into elm modules for you

Elm and SVGs are both awesome. Luckily parcel can help us turn SVG straight into
an Elm module.

**This plugin is for ParcelJS version 2**

## Installing and Setup

```
npm i -D parcel-transformer-elm-svg-modules
```

Then in your `.parcelrc` add the transformer BEFORE the regular Elm transform
(the svg modules need to be generated before Elm is compiled)

```json
{
  "extends": "@parcel/config-default",
  "transformers": {
    "*.elm": ["parcel-transformer-elm-svg-modules", "..."] // <-- add the new transform here, the "..." is important to keep the other defaults
  }
}
```

### Configuration

To configure, add this to your `package.json`.
The following entry would load SVGs from `src/assets/images/`
and combine them into an Elm Module named `Icons` located at
`src/Icons.elm`.
You can add more entries to the array to generate multiple modules.
Here's an example:

```
  "elmSvgModules": [
    {
      "inputSvgs": "src/assets/images/svg/*.svg", // a glob to place where your SVGs are
      "outputModuleName": "Icons", // the module name of the Elm module that's generated
      "outputModuleDir": "elm-stuff/parcel-transformer-elm-svg-modules/" // the location of the Elm module
    }
  ],
```

|       Option          |     Required            |           Default                               |
|       ------          |        -------          |         -------                                 |
|  inputSvgs            |        Yes              |          -                                      |
|  outputModuleName     |        No               |         `Icons`                                 |
|  outputModuleDir      |        no               | `elm-stuff/parcel-transformer-elm-svg-modules/` |

`outputModuleName` can also be something like `Acme.Icons` to generate a nested
module.

#### Dealing with the generated file

By default this plugin will put the generated code into `elm-stuff/parcel-transformer-elm-svg-modules/`,
since most likely you don't want to have the generated file in version control.

For Elm to be able to find the code though, you'll have to this the folder to
your `elm.json`.

```json
{
  "source-directories": [
    "src/",
    "elm-stuff/parcel-transformer-elm-svg-modules/"
  ]
}
```

##### If for whatever reason, you wanna add the code to source control ...

... just pick a location for `outputModuleDir` that works for you.

### Using the new Module in your code

Make sure to add `elm/svg` and `elm/virtual-dom` to your `elm.json`

```sh
elm install elm/svg
elm install elm/virtual-dom
```

Then in your Elm use your SVGs by importing the generated module.

```elm
-- the imports are named after the original file names of the SVGs
-- burger-menu.svg will result in an burgerMenu function
import Icons (burgerMenu, someOtherIcon)

view model =
  div []
    [ burgerMenu []
    , someOtherIcon []
    ]
```

## How it works

When the Elm module is processed by parcel this plugin uses its config to
find all the svg files and generates one Elm module per item in the config array.

## Credits

This plugin uses the awesome [`svg2elm`](https://github.com/pinata-llc/svg2elm) package under the hood.

Also lot's of inspiration for this plugin came from this [repo](https://github.com/pinata-llc/parcel-plugin-elm-svg),
which did the same as a parcel v1 plugin.
