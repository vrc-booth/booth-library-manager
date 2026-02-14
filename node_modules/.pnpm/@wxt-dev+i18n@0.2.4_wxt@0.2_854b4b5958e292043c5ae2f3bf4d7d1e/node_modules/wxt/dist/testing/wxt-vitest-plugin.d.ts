/**
 * Contains a Vitest plugin that configures your test environment to work with
 * WXT projects.
 *
 * @module wxt/testing/vitest
 */
import type * as vite from 'vite';
import { InlineConfig } from '../types';
/**
 * Vite plugin that configures Vitest with everything required to test a WXT extension, based on the `<root>/wxt.config.ts`
 *
 * ```ts
 * // vitest.config.ts
 * import { defineConfig } from 'vitest/config';
 * import { WxtVitest } from 'wxt/testing/vitest-plugin';
 *
 * export default defineConfig({
 *   plugins: [WxtVitest()],
 * });
 * ```
 *
 * @param inlineConfig Customize WXT's config for testing. Any config specified here overrides the config from your `wxt.config.ts` file.
 */
export declare function WxtVitest(inlineConfig?: InlineConfig): Promise<vite.PluginOption[]>;
