export interface IFoundResult {
	id: any;
	url: string | undefined;
}

export interface IBitmap {
	width: number;
	height: number;
	data: Uint8Array;
}

export interface ImageCache {
	getImage(url: string): Promise<string|undefined>;
	saveImage(url: string, data: IBitmap): Promise<string>;
	getCached(url: string): string;
}

export interface ImageProvider {
	getCrewImageUrl(crew: any, fullBody: boolean, id: any): Promise<IFoundResult>;
	getShipImageUrl(ship: any, id: any): Promise<IFoundResult>;
	getItemImageUrl(item: any, id: any): Promise<IFoundResult>;
	getFactionImageUrl(faction: any, id: any): Promise<IFoundResult>;
	getSprite(assetName: string, spriteName: string, id: any): Promise<IFoundResult>;
	getImageUrl(iconFile: string, id: any): Promise<IFoundResult>;
	getCached(withIcon: any): string;
	getCrewCached(crew: any, fullBody: boolean): string;
	getSpriteCached(assetName: string, spriteName: string): string;
}