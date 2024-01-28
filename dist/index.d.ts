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
export declare class MaplibreStyleSwitcherControl implements IControl {
    private static readonly DEFAULT_OPTIONS;
    private static readonly DEFAULT_STYLES;
    private controlContainer;
    private map?;
    private mapStyleContainer?;
    private styleButton?;
    private styles;
    private options?;
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
