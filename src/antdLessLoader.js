import lessLoader from 'less-loader';
import { getOptions } from 'loader-utils';
import fs from 'fs';
import path from 'path';
import { getScssThemePath } from './loaderUtils';
// import { loadScssThemeAsLess } from './utils';

/**
 * Modify less-loader's options with variable overrides extracted from the SCSS theme.
 * @param {Object} options - Options for less-loader
 * @return {Object} Options modified to include theme variables in the modifyVars property.
 */
export const overloadLessLoaderOptions = (options) => {
	const scssThemePath = getScssThemePath(options);

	// const themeModifyVars = loadScssThemeAsLess(scssThemePath);
	const themeModifyVars = fs.readFileSync(path.resolve(scssThemePath), 'utf8').replace(/\$/gi, '@');
	// const themeModifyVars = lessToJS(fs.readFileSync(path.resolve(scssThemePath), 'utf8').replace(/\$/gi, '@'));
	const lessOptions = {
		...options.lessOptions,
		appendData: () => {
			// loader.addDependency(path.resolve(__dirname, 'path/to/theme.less'));

			return themeModifyVars;
		},
	};

	return { ...options, lessOptions };
};

/**
 * A wrapper around less-loader which overloads loader options and registers the theme file
 * as a watched dependency.
 * @param {...*} args - Arguments passed to less-loader.
 * @return {*} The return value of less-loader, if any.
 */
export default function antdLessLoader(...args) {
	const loaderContext = this;
	const options = getOptions(loaderContext);

	const newLoaderContext = { ...loaderContext };
	try {
		const newOptions = overloadLessLoaderOptions(options);
		delete newOptions.scssThemePath;
		newLoaderContext.query = newOptions;
	} catch (error) {
		// Remove unhelpful stack from error.
		error.stack = undefined; // eslint-disable-line no-param-reassign
		throw error;
	}

	const scssThemePath = getScssThemePath(options);
	newLoaderContext.addDependency(scssThemePath);

	return lessLoader.call(newLoaderContext, ...args);
}
