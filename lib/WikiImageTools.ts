import STTApi from "./index";
import CONFIG from "./CONFIG";
import { ImageProvider, IFoundResult } from './ImageProvider';

async function getWikiImageUrl(fileName: string, id: any): Promise<IFoundResult> {
	let entry = await STTApi.wikiImages.where('fileName').equals(fileName).first();
	if (entry) {
		if (entry.url) {
			return { id, url: entry.url };
		} else {
			if ((Date.now() - entry.lastQueried) / 3600000 < CONFIG.HOURS_TO_RECOVERY) {
				throw new Error('The Wiki didn\'t have an image for ' + fileName);
			}
		}
	}

	let data = await STTApi.networkHelper.get('https://stt.wiki/w/api.php', {
			action: 'query',
			titles: 'File:' + fileName + "|File:" + fileName.replace('png', 'PNG') + "|File:" + fileName.replace('.png', '_Full.png') + "|File:" + fileName.replace('_', '-'),
			prop: 'imageinfo',
			iiprop: 'url|metadata',
			format: 'json'
		});

	let foundUrl = undefined;
	Object.keys(data.query.pages).forEach((pageKey: any) => {
		let page = data.query.pages[pageKey];
		if (page.imageinfo) {
			page.imageinfo.forEach((imgInfo: any) => {
				foundUrl = imgInfo.url;
			});
		}
	});

	STTApi.wikiImages.put({
		fileName: fileName,
		url: foundUrl,
		lastQueried: Date.now()
	});

	if (foundUrl) {
		return { id, url: foundUrl };
	}
	else {
		// the Wiki doesn't have this image yet, or it was named in a non-standard way
		//console.info('Caching the fact that ' + fileName + ' is not available in the wiki yet');
		throw new Error('The Wiki doesn\'t have an image yet for ' + fileName);
	}
}

export class WikiImageProvider implements ImageProvider {
	getCrewImageUrl(crew: any, fullBody: boolean, id: any): Promise<IFoundResult> {
		let fileName = crew.name.split(' ').join('_') + (fullBody ? '' : '_Head') + '.png';
		return getWikiImageUrl(fileName, id);
	}

	getShipImageUrl(ship: any, id: any): Promise<IFoundResult> {
		let fileName = ship.name.split(' ').join('_').split('.').join('').split('\'').join('') + '.png';
		return getWikiImageUrl(fileName, id);
	}

	getItemImageUrl(item: any, id: any): Promise<IFoundResult> {
		let fileName = item.name + CONFIG.RARITIES[item.rarity].name + '.png';
		fileName = fileName.split(' ').join('').split('\'').join('');
		return getWikiImageUrl(fileName, id);
	}

	getFactionImageUrl(faction: any, id: any): Promise<IFoundResult> {
		let fileName = 'Icon' + faction.name.split(' ').join('') + '.png';
		return getWikiImageUrl(fileName, id);
	}

	getSprite(assetName: string, spriteName: string, id: any): Promise<IFoundResult> {
		return Promise.reject('Not implemented');
	}

	getImageUrl(iconFile: string, id: any): Promise<IFoundResult> {
		let fileName = iconFile + '.png';
		return getWikiImageUrl(fileName, id);
	}

	getCached(withIcon: any): string {
		return '';
	}

	getCrewCached(crew: any, fullBody: boolean): string {
		return '';
	}

	getSpriteCached(assetName: string, spriteName: string): string {
		return '';
	}
}