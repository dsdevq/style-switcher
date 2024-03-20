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
export type TargetProps = BaseProps<'style'> | ArcGISTargetProps | OrthoTargetProps;
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
    glyphsUrl: string;
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
export declare class MaplibreStyleSwitcherControl implements IControl {
    private static readonly DEFAULT_OPTIONS;
    private controlContainer;
    private map?;
    private mapStyleContainer?;
    private styleButton?;
    private styles;
    private options?;
    private currentStyleName;
    private get defaultStyle();
    private get events();
    constructor(styles?: MaplibreStyleDefinition[], options?: MaplibreStyleSwitcherOptions);
    private changeStyle;
    getDefaultPosition(): ControlPosition;
    onAdd(map: Map): HTMLElement;
    onRemove(): void;
    private closeModal;
    private openModal;
    private onDocumentClick;
}
export {};
