import { ControlPosition, IControl, Map } from 'maplibre-gl';

export type BaseProps<K extends ThemeType> = {
	layer: number;
	source: number;
	name: string;
	type: K;
};

type ArcGISTargetProps = BaseProps<'arcgis'>;

interface OrthoTargetProps extends BaseProps<'ortho'> {
	serviceUrls: {
		TrueOrtho2019: string;
		Pereferiya11: string;
	};
}

export type TargetProps =
	| BaseProps<'style'>
	| ArcGISTargetProps
	| OrthoTargetProps;

export type ThemeProps<T extends string = string> = Record<T, TargetProps>;

type ThemeType = 'style' | 'arcgis' | 'ortho';

interface BaseTheme<K extends ThemeType> {
	styleUrl: string;
	type: K;
}

interface ArcGISTheme extends BaseTheme<'arcgis'> {
	serviceUrl: string;
}

interface OrthoTheme extends BaseTheme<'ortho'> {
	serviceUrls: {
		TrueOrtho2019: string;
		Pereferiya11: string;
	};
}
export type ThemeBody = BaseTheme<'style'> | ArcGISTheme | OrthoTheme;

export type MaplibreStyleDefinition = {
	title: string;
	uri: string;
	imageSrc?: string;
	activeImageScr?: string;
	targetProps: TargetProps;
	properties: ThemeProps;
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

	private controlContainer: HTMLElement;
	private map?: Map;
	private mapStyleContainer?: HTMLElement;
	private styleButton?: HTMLButtonElement;
	private styles: MaplibreStyleDefinition[];
	private options?: MaplibreStyleSwitcherOptions;
	private currentStyleName: string;

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
		this.styles = styles!;
		this.options = options || MaplibreStyleSwitcherControl.DEFAULT_OPTIONS;
		this.onDocumentClick = this.onDocumentClick.bind(this);
	}

	private async changeStyle(
		map: Map,
		uri: string,
		targetProps: TargetProps,
		properties: ThemeProps
	): Promise<void> {
		return new Promise((res) => {
			const { type, name } = targetProps;
			const arcGIS = type === 'arcgis';
			const ortho = type === 'ortho';
			map.once('styledata', () => {
				this.currentStyleName = name;
				res();
			});

			map.setStyle(
				type === 'arcgis' ? `${uri}/resources/styles/root.json` : uri,
				{
					...(this.options?.transformStyle && {
						transformStyle: (currentStyle, newStyle) => {
							if (!currentStyle) return newStyle;

							const { source, layer } =
								properties[currentStyle.name ?? this.currentStyleName];

							const commonSources = Object.fromEntries(
								Object.entries(currentStyle.sources).slice(source)
							);
							const commonLayers = currentStyle.layers.slice(layer);

							return {
								...newStyle,
								sources: {
									...(ortho
										? {
												...newStyle.sources,
												...Object.fromEntries(
													Object.entries(targetProps.serviceUrls).map(
														([key, value]) => {
															return [
																key,
																{
																	url: `${value}?f=pjson`,
																	type: 'raster',
																	tiles: [
																		`${value}/exportImage?bbox={bbox-epsg-3857}&bboxSR=102100&format=png32&imageSR=102100&f=image`,
																	],
																	tileSize: 256,
																},
															];
														}
													)
												),
										  }
										: newStyle.sources),
									...(arcGIS && {
										esri: {
											...newStyle.sources['esri'],
											tiles: [`${uri}/tile/{z}/{y}/{x}.pbf`],
											url: `${uri}?f=pjson`,
										},
									}),
									...commonSources,
								},
								layers: [...newStyle.layers, ...commonLayers],
								sprite: arcGIS
									? `${uri}/resources/sprites/sprite`
									: newStyle.sprite,
								glyphs: arcGIS
									? `${uri}/resources/fonts/{fontstack}/{range}.pbf`
									: newStyle.glyphs,
							};
						},
						diff: false,
					}),
				}
			);
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
		for (const {
			imageSrc,
			activeImageScr,
			title,
			uri,
			targetProps,
			properties,
		} of this.styles) {
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
			styleElement.addEventListener('click', (event) => {
				this.closeModal();
				if (styleElement.classList.contains('active')) {
					return;
				}
				if (this.events && this.events.onOpen && this.events.onOpen(event)) {
					return;
				}
				this.changeStyle(map, uri, targetProps, properties).then(() => {
					if (
						this.events &&
						this.events.onChange &&
						this.events.onChange(event, uri)
					) {
						return;
					}
				});
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
