import type { Component, Props, WingmanNode, WingmanElement } from './component.js';
import { flattenChildren } from './component.js';

/** Fragment component - just returns its children */
export function Fragment(props: { children?: WingmanNode }): WingmanNode {
  return props.children ?? null;
}

/** JSX factory function for elements with single child */
export function jsx(
  type: Component | string,
  props: Props,
  _key?: string
): WingmanElement {
  const { children, ...restProps } = props;
  return {
    type,
    props: restProps,
    children: flattenChildren(children),
  };
}

/** JSX factory function for elements with multiple children */
export function jsxs(
  type: Component | string,
  props: Props,
  _key?: string
): WingmanElement {
  return jsx(type, props, _key);
}

/** Development versions (same as production for now) */
export const jsxDEV = jsx;

export type { Component, Props, WingmanNode, WingmanElement };
