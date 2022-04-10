# Have parcel turn svg into elm modules for you

Elm and SVGs are both awesome. Luckily parcel can help us turn SVG straight into
an Elm module.

**This plugin is for ParcelJS version 2**

## Installing and Setup

```
npm i -D parcel-transformer-elm-svg-modules
```

Then in your `.parcelrc` add the transformer BEFORE the regular Elm tranform
(the svg modules need to be generated before Elm is compiled)

```
{
  "extends": "@parcel/config-default",
  "transformers": {
    "*.elm": ["parcel-transformer-elm-svg-modules", "..."] // <-- add the new transform here, the "..." are important
  }
}
```

### Configuration

To configure add this to your `package.json`.
The following entry would load SVGs from `src/assets/images/`
and combine them into an Elm Module named `Acme.Icons` located at
`src/Acme/Icons.elm`.
You can add more entries to the array to generate multiple modules.

```
  "elmSvgModules": [
    {
      "inputSvgs": "src/assets/images/svg/*.svg", // a glob to place where your SVGs are
      "outputModuleName": "Icons", // the module name of the Elm module that's generated
      "outputModuleDir": "src/" // the location of the Elm module
    }
  ],
```

### Using the new Module in your code

Make sure to add `elm/svg` and `elm/virtual-dom` to your `elm.json`

```sh
elm install elm/svg
elm install elm/virtual-dom
```

```elm
-- the imports are named after the original file names of the SVGs
-- burger-menu.svg will result in an burgerMenu function
import Acme.Icons (burgerMenu, someOtherIcon)
```

## How it works

TODO

## Credits

TODO
