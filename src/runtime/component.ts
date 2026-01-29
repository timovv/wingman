/** Props for any component */
export type Props = Record<string, unknown> & { children?: WingmanNode };

/** A Wingman component function */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Component<P extends Props = any> = (props: P) => WingmanNode;

/** Node types in the Wingman tree */
export type WingmanNode =
  | string
  | number
  | boolean
  | null
  | undefined
  | WingmanElement
  | WingmanNode[];

/** An element in the Wingman tree */
export interface WingmanElement {
  type: Component | string;
  props: Props;
  children: WingmanNode[];
}

/** Check if a node is an element */
export function isElement(node: WingmanNode): node is WingmanElement {
  return (
    typeof node === 'object' &&
    node !== null &&
    !Array.isArray(node) &&
    'type' in node
  );
}

/** Flatten nested arrays and filter out nullish values */
export function flattenChildren(children: WingmanNode): WingmanNode[] {
  if (children == null || typeof children === 'boolean') {
    return [];
  }
  if (Array.isArray(children)) {
    return children.flatMap(flattenChildren);
  }
  return [children];
}
