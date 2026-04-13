//#region node_modules/@sveltejs/kit/src/exports/internal/index.js
/** @import { StandardSchemaV1 } from '@standard-schema/spec' */
var HttpError = class {
	/**
	* @param {number} status
	* @param {{message: string} extends App.Error ? (App.Error | string | undefined) : App.Error} body
	*/
	constructor(status, body) {
		this.status = status;
		if (typeof body === "string") this.body = { message: body };
		else if (body) this.body = body;
		else this.body = { message: `Error: ${status}` };
	}
	toString() {
		return JSON.stringify(this.body);
	}
};
var Redirect = class {
	/**
	* @param {300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308} status
	* @param {string} location
	*/
	constructor(status, location) {
		try {
			new Headers({ location });
		} catch {
			throw new Error(`Invalid redirect location ${JSON.stringify(location)}: this string contains characters that cannot be used in HTTP headers`);
		}
		this.status = status;
		this.location = location;
	}
};
/**
* An error that was thrown from within the SvelteKit runtime that is not fatal and doesn't result in a 500, such as a 404.
* `SvelteKitError` goes through `handleError`.
* @extends Error
*/
var SvelteKitError = class extends Error {
	/**
	* @param {number} status
	* @param {string} text
	* @param {string} message
	*/
	constructor(status, text, message) {
		super(message);
		this.status = status;
		this.text = text;
	}
};
new TextEncoder();
new TextDecoder();
/**
* @param {string} encoded
* @returns {Uint8Array}
*/
function base64_decode(encoded) {
	const binary = atob(encoded);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}
//#endregion
export { SvelteKitError as i, HttpError as n, Redirect as r, base64_decode as t };
