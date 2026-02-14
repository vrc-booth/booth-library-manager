const AT_RULE_BLOCKS = /(\s*@(property|font-face)[\s\S]*?{[\s\S]*?})/gm;
export function splitShadowRootCss(css) {
  const documentCss = Array.from(css.matchAll(AT_RULE_BLOCKS), (m) => m[0]).join("").trim();
  const shadowCss = css.replace(AT_RULE_BLOCKS, "").trim();
  return {
    documentCss,
    shadowCss
  };
}
