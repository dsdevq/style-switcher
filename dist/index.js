export class MaplibreStyleSwitcherControl {
    get defaultStyle() {
        const defaultStyle = typeof this.options === 'string'
            ? this.options
            : this.options?.defaultStyle;
        return (defaultStyle || MaplibreStyleSwitcherControl.DEFAULT_OPTIONS.defaultStyle);
    }
    get events() {
        return this.options?.eventListeners;
    }
    constructor(styles, options) {
        this.styles = styles || MaplibreStyleSwitcherControl.DEFAULT_STYLES;
        this.options = options || MaplibreStyleSwitcherControl.DEFAULT_OPTIONS;
        this.onDocumentClick = this.onDocumentClick.bind(this);
    }
    async changeStyle(map, uri) {
        return new Promise((res) => {
            map.once('styledata', () => {
                res();
            });
            map.setStyle(uri, {
                ...(this.options?.transformStyle && {
                    transformStyle: (currentStyle, newStyle) => {
                        if (!currentStyle)
                            return newStyle;
                        newStyle.sources = { ...currentStyle.sources };
                        newStyle.layers = [
                            ...newStyle.layers,
                            ...currentStyle.layers,
                        ].filter((value, index, array) => index === array.findIndex(({ id }) => id === value.id));
                        return newStyle;
                    },
                    diff: false,
                }),
            });
        });
    }
    getDefaultPosition() {
        const defaultPosition = 'top-right';
        return defaultPosition;
    }
    onAdd(map) {
        this.map = map;
        this.controlContainer = document.createElement('div');
        this.controlContainer.classList.add('mapboxgl-ctrl', 'mapboxgl-ctrl-group', 'maplibregl-ctrl', 'maplibregl-ctrl-group');
        this.mapStyleContainer = document.createElement('div');
        this.styleButton = document.createElement('button');
        this.styleButton.type = 'button';
        this.mapStyleContainer.classList.add('mapboxgl-style-list', this.options.displayMode);
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
            const icon = styleElement.querySelector('.icon');
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
                this.changeStyle(map, uri).then(() => {
                    if (this.events &&
                        this.events.onChange &&
                        this.events.onChange(event, uri)) {
                        return;
                    }
                });
                const el = this.mapStyleContainer.getElementsByClassName('active')[0];
                if (el) {
                    el.classList.remove('active');
                    const elIcon = el.querySelector('.icon');
                    const title = el.classList[0];
                    const elImageSrc = this.styles.find((v) => v.title === title).imageSrc;
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
    onRemove() {
        if (!this.controlContainer ||
            !this.controlContainer.parentNode ||
            !this.map ||
            !this.styleButton) {
            return;
        }
        this.styleButton.removeEventListener('click', this.onDocumentClick);
        this.controlContainer.parentNode.removeChild(this.controlContainer);
        document.removeEventListener('click', this.onDocumentClick);
        this.map = undefined;
    }
    closeModal() {
        if (this.mapStyleContainer && this.styleButton) {
            this.mapStyleContainer.style.display = 'none';
            this.styleButton.style.display = 'block';
        }
    }
    openModal() {
        if (this.mapStyleContainer && this.styleButton) {
            this.mapStyleContainer.style.display = 'flex';
            this.styleButton.style.display = 'none';
        }
    }
    onDocumentClick(event) {
        if (this.controlContainer &&
            !this.controlContainer.contains(event.target)) {
            this.closeModal();
        }
    }
}
MaplibreStyleSwitcherControl.DEFAULT_OPTIONS = {
    defaultStyle: 'Streets',
    transformStyle: false,
    displayMode: 'column',
    showTitle: true,
};
MaplibreStyleSwitcherControl.DEFAULT_STYLES = [
    { title: 'Dark', uri: 'mapbox://styles/mapbox/dark-v10' },
    { title: 'Light', uri: 'mapbox://styles/mapbox/light-v10' },
    { title: 'Outdoors', uri: 'mapbox://styles/mapbox/outdoors-v11' },
    { title: 'Satellite', uri: 'mapbox://styles/mapbox/satellite-streets-v11' },
    { title: 'Streets', uri: 'mapbox://styles/mapbox/streets-v11' },
];
//# sourceMappingURL=index.js.map