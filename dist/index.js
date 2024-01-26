"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class MapboxStyleSwitcherControl {
    constructor(styles, options) {
        this.options = {
            displayMode: 'column',
            showTitle: true,
        };
        this.styles = styles || MapboxStyleSwitcherControl.DEFAULT_STYLES;
        const defaultStyle = typeof options === 'string'
            ? options
            : options
                ? options.defaultStyle
                : undefined;
        this.defaultStyle =
            defaultStyle || MapboxStyleSwitcherControl.DEFAULT_STYLE;
        if (options && typeof options === 'object') {
            this.options = options;
        }
        this.onDocumentClick = this.onDocumentClick.bind(this);
        this.events =
            typeof options !== 'string' && options
                ? options.eventListeners
                : undefined;
    }
    changeTheme(map, url) {
        return __awaiter(this, void 0, void 0, function* () {
            return fetch(url)
                .then((res) => res.json())
                .then((newStyle) => {
                const currentStyle = map.getStyle();
                newStyle.sources = Object.assign({}, currentStyle.sources);
                newStyle.layers = [...newStyle.layers, ...currentStyle.layers].filter((value, index, array) => {
                    return index === array.findIndex((v) => v.id === value.id);
                });
                map.setStyle(newStyle);
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
                image.classList.add('icon');
                image.src = imageSrc;
                image.width = 20;
                image.height = 20;
                styleElement.appendChild(image);
            }
            if (this.options.showTitle) {
                const titleEl = document.createElement('span');
                titleEl.textContent = title;
                styleElement.appendChild(titleEl);
            }
            const icon = styleElement.querySelector('.icon');
            styleElement.type = 'button';
            styleElement.classList.add(title.replace(/[^a-z0-9-]/gi, '_'));
            styleElement.addEventListener('click', (event) => __awaiter(this, void 0, void 0, function* () {
                this.closeModal();
                if (styleElement.classList.contains('active')) {
                    return;
                }
                if (this.events && this.events.onOpen && this.events.onOpen(event)) {
                    return;
                }
                yield this.changeTheme(map, uri);
                const el = this.mapStyleContainer.getElementsByClassName('active')[0];
                if (el) {
                    el.classList.remove('active');
                    const elIcon = el.querySelector('.icon');
                    const title = el.classList[0];
                    const elImageSrc = this.styles.find((v) => v.title === title).imageSrc;
                    elImageSrc && elIcon.setAttribute('src', elImageSrc);
                }
                styleElement.classList.add('active');
                if (activeImageScr) {
                    icon.setAttribute('src', activeImageScr);
                }
                if (this.events &&
                    this.events.onChange &&
                    this.events.onChange(event, uri)) {
                    return;
                }
            }));
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
MapboxStyleSwitcherControl.DEFAULT_STYLE = 'Streets';
MapboxStyleSwitcherControl.DEFAULT_STYLES = [
    { title: 'Dark', uri: 'mapbox://styles/mapbox/dark-v10' },
    { title: 'Light', uri: 'mapbox://styles/mapbox/light-v10' },
    { title: 'Outdoors', uri: 'mapbox://styles/mapbox/outdoors-v11' },
    { title: 'Satellite', uri: 'mapbox://styles/mapbox/satellite-streets-v11' },
    { title: 'Streets', uri: 'mapbox://styles/mapbox/streets-v11' },
];
exports.MapboxStyleSwitcherControl = MapboxStyleSwitcherControl;
//# sourceMappingURL=index.js.map