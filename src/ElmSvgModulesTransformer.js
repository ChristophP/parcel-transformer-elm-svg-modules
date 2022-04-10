const ThrowableDiagnostic = require("@parcel/diagnostic");
const { Transformer } = require("@parcel/plugin");

const { generateModule } = require("svg2elm");
const glob = require("glob");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");

const { md } = ThrowableDiagnostic;
const asyncGlob = promisify(glob);

module.exports = new Transformer({
  async loadConfig({ config }) {
    const { contents, filePath } = await config.getConfig(["package.json"]);

    return contents.elmSvgModules;
  },
  async transform({ asset, config, logger }) {
    // Retrieve the asset's source code and source map.
    const source = await asset.getCode();
    const sourceMap = await asset.getMap();

    logger.info({
      message: md`ElmSvg config: ${JSON.stringify(config)}`,
    });

    // Run it through some compiler, and set the results
    // on the asset.
    // const { code, map } = compile(source, sourceMap);
    // asset.setCode(code);
    // asset.setMap(map);

    const generate = async ({ src, name, dest }) => {
      await fs.promises.mkdir(path.dirname(dest), { recursive: true });
      return asyncGlob(src, {})
        .then(async (filePaths) => {
          logger.info({ message: JSON.stringify(filePaths) });
          try {
            const moduleCode = await generateModule(name, filePaths);

            await fs.promises.writeFile(dest, moduleCode);
          } catch (writeError) {
            error(`Failed to generate ${name}`, writeError);
          }
        })
        .catch((err) => {
          if (err) {
            throw new ThrowableDiagnostic({
              diagnostic: {
                message: `Failed to resolve file path for ${name}`,
                stack: err.stack,
              },
            });
          }
        });
    }
    await Promise.allSettled(config.map(generate));

    // Return the asset
    return [asset];
  },
});
