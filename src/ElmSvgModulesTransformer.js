const ThrowableDiagnostic = require("@parcel/diagnostic");
const { Transformer } = require("@parcel/plugin");

const { generateModule } = require("svg2elm");
const glob = require("glob");
const fs = require("fs").promises;
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
    // const source = await asset.getCode();
    // const sourceMap = await asset.getMap();

    // Run it through some compiler, and set the results
    // on the asset.
    // const { code, map } = compile(source, sourceMap);
    // asset.setCode(code);
    // asset.setMap(map);

    const generate = async ({
      inputSvgs,
      outputModuleName = "Icons",
      outputModuleDir = "src/",
    }) => {
      const elmModulePath = outputModuleName.replace(".", "/").concat(".elm");
      const resolvedModulePath = path.join(outputModuleDir, elmModulePath);
      await fs.mkdir(path.dirname(resolvedModulePath), { recursive: true });

      logger.info({
        message: `Writing module to: ${resolvedModulePath} for ${inputSvgs}`,
      });
      return asyncGlob(inputSvgs, {})
        .then(async (filePaths) => {
          logger.verbose({ message: `Found SVGs ${filePaths.join(", ")}` });
          try {
            const moduleCode = await generateModule(
              outputModuleName,
              filePaths
            );

            await fs.writeFile(resolvedModulePath, moduleCode);
          } catch (writeError) {
            throw new ThrowableDiagnostic({
              diagnostic: {
                message: `Failed to generate ${outputModuleName}`,
                stack: writeError.stack,
              },
            });
          }
        })
        .catch((err) => {
          if (err) {
            throw new ThrowableDiagnostic({
              diagnostic: {
                message: `Failed to resolve file path for ${outputModuleName}`,
                stack: err.stack,
              },
            });
          }
        });
    };
    await Promise.allSettled(config.map(generate));

    logger.info({ message: md`Generated ${config.length} module(s)` });

    // Return the asset
    return [asset];
  },
});
