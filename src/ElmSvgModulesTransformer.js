const ThrowableDiagnostic = require("@parcel/diagnostic");
const { Transformer } = require("@parcel/plugin");

const { generateModule } = require("svg2elm");
const glob = require("glob");
const fs = require("fs").promises;
const path = require("path");
const { promisify } = require("util");

const { md } = ThrowableDiagnostic;
const asyncGlob = promisify(glob);

const settle = (promise) =>
  Promise.allSettled([promise]).then(([{ value, reason }]) => [reason, value]);

module.exports = new Transformer({
  async loadConfig({ config }) {
    const { contents, filePath } = await config.getConfig(["package.json"]);

    return contents.elmSvgModules;
  },
  async transform({ asset, config, logger }) {
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
      const [globErr, filePaths] = await settle(asyncGlob(inputSvgs, {}));
      if (globErr) {
        throw new ThrowableDiagnostic({
          diagnostic: {
            message: `Failed to resolve file path for ${outputModuleName}`,
            stack: globErr.stack,
          },
        });
      }

      logger.verbose({ message: `Found SVGs ${filePaths.join(", ")}` });
      const [genErr, moduleCode] = await settle(
        generateModule(outputModuleName, filePaths)
      );

      if (genErr) {
        throw new ThrowableDiagnostic({
          diagnostic: {
            message: `Failed to generate ${outputModuleName}`,
            stack: genErr.stack,
          },
        });
      }

      const finalCode = [
        "-- THIS MODULE IS GENERATED. DON'T EDIT BY HAND.",
        moduleCode,
      ].join("\n\n");

      await fs.writeFile(resolvedModulePath, finalCode);
    };

    await Promise.allSettled(config.map(generate));

    logger.info({ message: md`Generated ${config.length} module(s)` });

    // Return the asset
    return [asset];
  },
});
