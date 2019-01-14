// an implemention of NetworkInterface using the native browser fetch functionality
import { NetworkInterface } from "./NetworkInterface";
import CONFIG from "./CONFIG";

export class NetworkFetch implements NetworkInterface {
	async post(uri: string, form: any, bearerToken: string | undefined = undefined, getjson: boolean = true): Promise<any> {
		let searchParams: URLSearchParams = new URLSearchParams();
		for (const prop of Object.keys(form)) {
			searchParams.set(prop, form[prop]);
		}

		let headers: any = {
			"Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
		};

		if (bearerToken !== undefined) {
			headers.Authorization = "Bearer " + btoa(bearerToken);
		}

		let response = await window.fetch(uri, {
			method: "post",
			headers: headers,
			body: searchParams.toString()
		});

		if (response.ok) {
			if (getjson) {
				return response.json();
			} else {
				return response.text();
			}
		} else {
			let data = await response.text();
			throw new Error(`Network error; status ${response.status}; reply ${data}.`);
		}
	}

	async get(uri: string, qs: any, json: boolean = true): Promise<any> {
		let response;
		if (qs) {
			let searchParams: URLSearchParams = new URLSearchParams();
			for (const prop of Object.keys(qs)) {
				if (Array.isArray(qs[prop])) {
					qs[prop].forEach((entry: any): void => {
						searchParams.append(prop + '[]', entry);
					});
				}
				else {
					searchParams.set(prop, qs[prop]);
				}
			}

			response = await window.fetch(uri + "?" + searchParams.toString());
		} else {
			response = await window.fetch(uri);
		}

		if (response.ok) {
			if (json) {
				return response.json();
			} else {
				return response.text();
			}
		} else {
			let data = await response.text();
			throw new Error(`Network error; status ${response.status}; reply ${data}.`);
		}
	}

	private _urlProxy: string | undefined = undefined;

	setProxy(urlProxy: string): void {
		this._urlProxy = urlProxy;
	}

	async get_proxy(uri: string, qs: any) : Promise<any> {
		if (!this._urlProxy) {
			return this.get(uri, qs);
		} else {
			let response = await this.postjson(this._urlProxy + '/get', {origURI: uri, qs});

			if (response.ok) {
				return response.json();
			} else {
				let data = await response.text();
				throw new Error(`Network error; status ${response.status}; reply ${data}.`);
			}
		}
	}

	async post_proxy(uri: string, form: any, bearerToken?: string): Promise<any> {
		if (!this._urlProxy) {
			return this.post(uri, form, bearerToken);
		} else {
			let response = await this.postjson(this._urlProxy + '/post', {origURI: uri, form, bearerToken});

			if (response.ok) {
				return response.json();
			} else {
				let data = await response.text();
				throw new Error(`Network error; status ${response.status}; reply ${data}.`);
			}
		}
	}

	async postjson(uri: string, form: any): Promise<any> {
		let headers: any = {
			"Content-type": "application/json"
		};
	
		let response = await window.fetch(uri, {
			method: "post",
			headers: headers,
			body: JSON.stringify(form)
		});
	
		return response;
	}

	async getRaw(uri: string, qs: any): Promise<any> {
		// TODO: this should not be in here (networkfetch should be agnostic of its callers)
		let headers: any = {
			'Origin': CONFIG.URL_SERVER,
			'Referer': CONFIG.URL_SERVER,
			'Accept': '*/*',
			'Accept-Encoding': 'gzip, deflate, br'
		};

		let response = await window.fetch(uri, {
			method: "get",
			headers: headers
		});

		if (response && response.ok && response.body) {
			let reader = response.body.getReader();
			let buffers: Buffer[] = [];
			let getAllData = async (): Promise<any> => {
				let result = await reader.read();
				if (!result.done) {
					buffers.push(new Buffer(result.value));
					return getAllData();
				}

				return Buffer.concat(buffers);
			}

			return getAllData();
		}

		throw new Error("Fail loading data");
	}
}