// Editor-only presentation. Core Button edits a RichText element, not its
// saved anchor. Read the block attributes; never add attributes to saved HTML.
(() => {
  const { hooks, element } = window.wp;
  hooks.addFilter('editor.BlockListBlock', 'jwsnj/file-link-icons', BlockListBlock => {
    return function JwsnjFileLinkIcon(props) {
      if (props.name !== 'core/button') return element.createElement(BlockListBlock, props);
      const { url, linkTarget } = props.attributes || {};
      const kind = window.jwsnjClassifyFileIcon(url) || (linkTarget === '_blank' ? 'external' : '');
      return element.createElement(BlockListBlock, {
        ...props,
        wrapperProps: {
          ...props.wrapperProps,
          'data-jwsnj-editor-link-icon': kind || undefined
        }
      });
    };
  });
})();
