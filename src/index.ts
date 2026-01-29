// Main exports
export { compose, writeOutput, type CompositorOptions, type CompositorResult, type OutputFile as OutputFileResult } from './compositor/index.js';
export { render, type RenderResult, type RenderMetadata, type OutputFileDef } from './compositor/renderer.js';
export { loadEntry } from './compositor/loader.js';

// Runtime exports
export { useContext, type CompositorContext } from './runtime/context.js';
export type { Component, Props, WingmanNode, WingmanElement } from './runtime/component.js';

// Component exports
export { Instructions, Skill, Include, OutputFile, Frontmatter, type InstructionsProps, type SkillProps, type IncludeProps, type OutputFileProps, type FrontmatterProps } from './components/index.js';
