import { IControl, Map as MapboxMap } from 'mapbox-gl';

import mapboxgl = require('mapbox-gl');

export type MapboxStyleDefinition = {
	title: string;
	uri: string;
	imageSrc?: string;
	activeImageScr?: string;
};

export type MapboxStyleSwitcherOptions = {
	defaultStyle?: string;
	eventListeners?: MapboxStyleSwitcherEvents;
};

type MapboxStyleSwitcherEvents = {
	onOpen?: (event: MouseEvent) => boolean;
	onSelect?: (event: MouseEvent) => boolean;
	onChange?: (event: MouseEvent, style: string) => boolean;
};

export class MapboxStyleSwitcherControl implements IControl {
	private static readonly DEFAULT_STYLE = 'Streets';
	private static readonly DEFAULT_STYLES = [
		{ title: 'Dark', uri: 'mapbox://styles/mapbox/dark-v10' },
		{ title: 'Light', uri: 'mapbox://styles/mapbox/light-v10' },
		{ title: 'Outdoors', uri: 'mapbox://styles/mapbox/outdoors-v11' },
		{ title: 'Satellite', uri: 'mapbox://styles/mapbox/satellite-streets-v11' },
		{ title: 'Streets', uri: 'mapbox://styles/mapbox/streets-v11' },
	];

	private controlContainer: HTMLElement | undefined;
	private events?: MapboxStyleSwitcherEvents;
	private map?: MapboxMap;
	private mapStyleContainer: HTMLElement | undefined;
	private styleButton: HTMLButtonElement | undefined;
	private styles: MapboxStyleDefinition[];
	private defaultStyle: string;

	constructor(
		styles?: MapboxStyleDefinition[],
		options?: MapboxStyleSwitcherOptions | string
	) {
		this.styles = styles || MapboxStyleSwitcherControl.DEFAULT_STYLES;
		const defaultStyle =
			typeof options === 'string'
				? options
				: options
				? options.defaultStyle
				: undefined;
		this.defaultStyle =
			defaultStyle || MapboxStyleSwitcherControl.DEFAULT_STYLE;
		this.onDocumentClick = this.onDocumentClick.bind(this);
		this.events =
			typeof options !== 'string' && options
				? options.eventListeners
				: undefined;
	}

	private async changeTheme(map: mapboxgl.Map, url: string): Promise<void> {
		return fetch(url)
			.then((res) => res.json() as Promise<mapboxgl.Style>)
			.then((newStyle) => {
				const currentStyle = map.getStyle();
				newStyle.sources = { ...currentStyle.sources };
				newStyle.layers = [...newStyle.layers!, ...currentStyle.layers!].filter(
					(value, index, array) => {
						// Remove duplicated layers from currentStyle
						return index === array.findIndex((v) => v.id === value.id);
					}
				);
				map.setStyle(newStyle);
			});
	}

	public getDefaultPosition(): string {
		const defaultPosition = 'top-right';
		return defaultPosition;
	}

	public onAdd(map: MapboxMap): HTMLElement {
		this.map = map;
		this.controlContainer = document.createElement('div');
		this.controlContainer.classList.add(
			'mapboxgl-ctrl',
			'mapboxgl-ctrl-group',
			'maplibregl-ctrl',
			'maplibregl-ctrl',
			'maplibregl-ctrl-group'
		);
		this.mapStyleContainer = document.createElement('div');
		this.styleButton = document.createElement('button');
		this.styleButton.type = 'button';
		this.mapStyleContainer.classList.add('mapboxgl-style-list');
		for (const { imageSrc, activeImageScr, title, uri } of this.styles) {
			const styleElement = document.createElement('button');
			if (imageSrc) {
				const image = document.createElement('img');
				image.classList.add('icon');
				image.src = imageSrc;
				image.width = 20;
				image.height = 20;
				styleElement.appendChild(image);
			}

			const icon = styleElement.querySelector('.icon') as HTMLImageElement;

			styleElement.type = 'button';

			const titleEl = document.createElement('span');
			titleEl.textContent = title;
			styleElement.appendChild(titleEl);
			styleElement.classList.add(title.replace(/[^a-z0-9-]/gi, '_'));
			styleElement.addEventListener('click', async (event) => {
				this.closeModal();
				if (styleElement.classList.contains('active')) {
					return;
				}
				if (this.events && this.events.onOpen && this.events.onOpen(event)) {
					return;
				}
				await this.changeTheme(map, uri);
				const elms = this.mapStyleContainer!.getElementsByClassName('active');
				while (elms[0]) {
					elms[0].classList.remove('active');
					imageSrc && icon.setAttribute('src', imageSrc);
				}
				styleElement.classList.add('active');
				activeImageScr && icon.setAttribute('src', activeImageScr);
				if (
					this.events &&
					this.events.onChange &&
					this.events.onChange(event, uri)
				) {
					return;
				}
			});
			if (title === this.defaultStyle) {
				styleElement.classList.add('active');
				icon && activeImageScr && icon.setAttribute('src', activeImageScr);
			}
			this.mapStyleContainer.appendChild(styleElement);
		}
		this.styleButton.classList.add('mapboxgl-ctrl-icon');
		this.styleButton.classList.add('mapboxgl-style-switcher');
		this.styleButton.addEventListener('click', (event) => {
			if (this.events && this.events.onSelect && this.events.onSelect(event)) {
				return;
			}
			this.openModal();
		});

		document.addEventListener('click', this.onDocumentClick);

		this.controlContainer.appendChild(this.styleButton);
		this.controlContainer.appendChild(this.mapStyleContainer);
		return this.controlContainer;
	}

	public onRemove(): void {
		if (
			!this.controlContainer ||
			!this.controlContainer.parentNode ||
			!this.map ||
			!this.styleButton
		) {
			return;
		}
		this.styleButton.removeEventListener('click', this.onDocumentClick);
		this.controlContainer.parentNode.removeChild(this.controlContainer);
		document.removeEventListener('click', this.onDocumentClick);
		this.map = undefined;
	}

	private closeModal(): void {
		if (this.mapStyleContainer && this.styleButton) {
			this.mapStyleContainer.style.display = 'none';
			this.styleButton.style.display = 'block';
		}
	}

	private openModal(): void {
		if (this.mapStyleContainer && this.styleButton) {
			this.mapStyleContainer.style.display = 'block';
			this.styleButton.style.display = 'none';
		}
	}

	private onDocumentClick(event: MouseEvent): void {
		if (
			this.controlContainer &&
			!this.controlContainer.contains(event.target as Element)
		) {
			this.closeModal();
		}
	}
}
