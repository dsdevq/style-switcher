import { ControlPosition, IControl, Map } from 'maplibre-gl';

export type MaplibreStyleDefinition = {
	title: string;
	uri: string;
	imageSrc?: string;
	activeImageScr?: string;
};

export type MaplibreStyleSwitcherOptions = Partial<{
	defaultStyle: string;
	displayMode: DisplayMode;
	transformStyle: boolean;
	showTitle: boolean;
	eventListeners: MaplibreStyleSwitcherEvents;
}>;

type MaplibreStyleSwitcherEvents = Partial<{
	onOpen: (event: MouseEvent) => boolean;
	onSelect: (event: MouseEvent) => boolean;
	onChange: (event: MouseEvent, style: string) => boolean;
}>;

type DisplayMode = 'row' | 'column';

export class MaplibreStyleSwitcherControl implements IControl {
	private static readonly DEFAULT_OPTIONS: MaplibreStyleSwitcherOptions = {
		defaultStyle: 'Streets',
		transformStyle: false,
		displayMode: 'column',
		showTitle: true,
	};
	private static readonly DEFAULT_STYLES = [
		{ title: 'Dark', uri: 'mapbox://styles/mapbox/dark-v10' },
		{ title: 'Light', uri: 'mapbox://styles/mapbox/light-v10' },
		{ title: 'Outdoors', uri: 'mapbox://styles/mapbox/outdoors-v11' },
		{ title: 'Satellite', uri: 'mapbox://styles/mapbox/satellite-streets-v11' },
		{ title: 'Streets', uri: 'mapbox://styles/mapbox/streets-v11' },
	];

	private controlContainer: HTMLElement;
	private map?: Map;
	private mapStyleContainer?: HTMLElement;
	private styleButton?: HTMLButtonElement;
	private styles: MaplibreStyleDefinition[];
	private options?: MaplibreStyleSwitcherOptions;

	private get defaultStyle(): MaplibreStyleSwitcherOptions['defaultStyle'] {
		const defaultStyle =
			typeof this.options === 'string'
				? this.options
				: this.options?.defaultStyle;
		return (
			defaultStyle || MaplibreStyleSwitcherControl.DEFAULT_OPTIONS.defaultStyle
		);
	}

	private get events(): MaplibreStyleSwitcherOptions['eventListeners'] {
		return this.options?.eventListeners;
	}

	constructor(
		styles?: MaplibreStyleDefinition[],
		options?: MaplibreStyleSwitcherOptions
	) {
		this.styles = styles || MaplibreStyleSwitcherControl.DEFAULT_STYLES;
		this.options = options || MaplibreStyleSwitcherControl.DEFAULT_OPTIONS;
		this.onDocumentClick = this.onDocumentClick.bind(this);
	}

	private async changeStyle(map: Map, uri: string): Promise<void> {
		return new Promise((res) => {
			map.once('styledata', () => {
				res();
			});

			map.setStyle(uri, {
				...(this.options?.transformStyle && {
					transformStyle: (currentStyle, newStyle) => {
						if (!currentStyle) return newStyle;
						const sources = currentStyle.sources;
						const layers = [...newStyle.layers, ...currentStyle.layers].filter(
							(value, index, array) =>
								index === array.findIndex(({ id }) => id === value.id)
						);
						return {
							...newStyle,
							sources,
							layers,
						};
					},
				}),
			});
		});
	}

	public getDefaultPosition(): ControlPosition {
		const defaultPosition = 'top-right';
		return defaultPosition;
	}

	public onAdd(map: Map): HTMLElement {
		this.map = map;
		this.controlContainer = document.createElement('div');
		this.controlContainer.classList.add(
			'mapboxgl-ctrl',
			'mapboxgl-ctrl-group',
			'maplibregl-ctrl',
			'maplibregl-ctrl-group'
		);
		this.mapStyleContainer = document.createElement('div');
		this.styleButton = document.createElement('button');
		this.styleButton.type = 'button';

		this.mapStyleContainer.classList.add(
			'mapboxgl-style-list',
			this.options!.displayMode!
		);
		for (const { imageSrc, activeImageScr, title, uri } of this.styles) {
			const styleElement = document.createElement('button');
			if (imageSrc) {
				const image = document.createElement('img');
				image.src = imageSrc;
				image.width = 20;
				image.height = 20;
				image.classList.add('icon');
				styleElement.appendChild(image);
			}
			if (this.options?.showTitle) {
				const titleEl = document.createElement('span');
				titleEl.textContent = title;
				styleElement.appendChild(titleEl);
			}

			const icon = styleElement.querySelector('.icon') as HTMLImageElement;

			styleElement.setAttribute('type', 'button');
			styleElement.classList.add(title.replace(/[^a-z0-9-]/gi, '_'));
			styleElement.addEventListener('click', async (event) => {
				this.closeModal();
				if (styleElement.classList.contains('active')) {
					return;
				}
				if (this.events && this.events.onOpen && this.events.onOpen(event)) {
					return;
				}
				await this.changeStyle(map, uri);
				const el = this.mapStyleContainer!.getElementsByClassName('active')[0];
				if (el) {
					el.classList.remove('active');
					const elIcon = el.querySelector('.icon') as HTMLImageElement | null;
					const title = el.classList[0];
					const elImageSrc = this.styles.find(
						(v) => v.title === title
					)!.imageSrc;
					elImageSrc && elIcon?.setAttribute('src', elImageSrc);
				}
				styleElement.classList.add('active');
				if (activeImageScr) {
					icon.setAttribute('src', activeImageScr);
				}
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
			this.mapStyleContainer.style.display = 'flex';
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
