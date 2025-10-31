module.exports = function transformImportMeta({ template }) {
  const buildReplacement = template.expression(`(() => {
    const env = typeof process !== 'undefined' && process.env ? process.env : {};
    const url = typeof document !== 'undefined' && document.currentScript
      ? document.currentScript.src
      : (typeof location !== 'undefined' ? location.href : '');

    return { url, env };
  })()`);

  return {
    name: 'inline-transform-import-meta',
    manipulateOptions(_, parserOpts) {
      if (!parserOpts) {
        return;
      }

      parserOpts.plugins = parserOpts.plugins || [];
      if (!parserOpts.plugins.includes('importMeta')) {
        parserOpts.plugins.push('importMeta');
      }
    },
    visitor: {
      MetaProperty(path) {
        const { node } = path;
        if (node.meta && node.meta.name === 'import' && node.property && node.property.name === 'meta') {
          path.replaceWith(buildReplacement());
        }
      },
    },
  };
};