import each from "lodash/each";
import normalizeWheel from "normalize-wheel";
import GSAP from "gsap";
import Prefix from "prefix";
import map from "lodash/map";
import Title from "animations/Title.js";
import AsyncLoad from "classes/AsyncLoad";
import Paragraph from "../animations/Paragraph";
import Label from "../animations/Label";
import Highlight from "../animations/Highlight";
import { ColorsManager } from "classes/Colors";
import { Detection } from "classes/Detection";

export default class Page {
  constructor({ element, elements, id }) {
    this.selector = element;
    this.selectorChildren = {
      ...elements,
      animationsTitles: '[data-animation="title"]',
      animationsParagraphs: '[data-animation="paragraph"]',
      animationsLabels: '[data-animation="label"]',
      animationsHighlights: '[data-animation="highlight"]',
      preloaders: "[data-src]",
    };
    this.id = id;
    this.transformPrefix = Prefix("transform");

    // this.onMouseWheelEvent = this.onMouseWheel.bind(this);
    // this.onWheelEvent = this.onWheel.bind(this);
  }

  create() {
    this.element = document.querySelector(this.selector);
    this.elements = {};
    this.scroll = {
      current: 0,
      target: 0,
      last: 0,
      limit: 0,
    };
    each(this.selectorChildren, (entry, key) => {
      if (
        entry instanceof window.HTMLElement ||
        entry instanceof window.NodeList ||
        Array.isArray(entry)
      ) {
        this.elements[key] = entry;
      } else {
        this.elements[key] = this.element.querySelectorAll(entry);

        if (this.elements[key].length === 0) {
          this.elements[key] = null;
        } else if (this.elements[key].length === 1) {
          this.elements[key] = this.element.querySelector(entry);
        }
      }
    }); //end each

    this.createAnimations();
    this.createPreloader();
  } //end create

  createAnimations() {
    this.animations = [];

    this.animationsHighlights = map(
      this.elements.animationsHighlights,
      (element) => {
        return new Highlight({ element });
      }
    );

    this.animations.push(...this.animationsHighlights);

    this.animationsTitles = map(this.elements.animationsTitles, (element) => {
      return new Title({ element });
    });

    this.animations.push(...this.animationsTitles);

    this.animationsParagraphs = map(
      this.elements.animationsParagraphs,
      (element) => {
        return new Paragraph({ element });
      }
    );

    this.animations.push(...this.animationsParagraphs);

    this.animationsLabels = map(this.elements.animationsLabels, (element) => {
      return new Label({ element });
    });

    this.animations.push(...this.animationsLabels);
  }

  createPreloader() {
    this.preloaders = map(this.elements.preloaders, (element) => {
      return new AsyncLoad({ element });
    });
  }

  /**
   *
   * Animations
   */
  show() {
    return new Promise((resolve) => {
      ColorsManager.change({
        backgroundColor: this.element.getAttribute("data-background"),
        color: this.element.getAttribute("data-color"),
      });
      this.animationIn = GSAP.timeline();
      this.animationIn.fromTo(this.element, { autoAlpha: 0 }, { autoAlpha: 1 });

      this.animationIn.call((_) => {
        this.addEventListeners();
        resolve();
      });
    });
  }

  hide() {
    return new Promise((resolve) => {
      this.destroy();
      this.animationOut = GSAP.timeline();
      this.animationOut.to(this.element, { autoAlpha: 0, onComplete: resolve });
    });
  }

  /**
   *
   * Events
   */

  onTouchDown(event) {
    if (!Detection.isMobile) return;

    this.isDown = true;

    this.scroll.position = this.scroll.current;
    this.start = event.touches ? event.touches[0].clientY : event.clientY;
  }

  onTouchMove(event) {
    if (!Detection.isMobile || !this.isDown) return;

    const y = event.touches ? event.touches[0].clientY : event.clientY;
    const distance = (this.start - y) * 3;

    this.scroll.target = this.scroll.position + distance;
  }

  onTouchUp() {
    if (!Detection.isMobile) return;

    this.isDown = false;
  }

  onMouseWheel(event) {
    const { pixelY } = normalizeWheel(event);
    this.scroll.target += pixelY;
  }

  onWheel(event) {
    const { pixelY } = normalizeWheel(event);
    this.scroll.target += pixelY;
  }

  onResize() {
    if (this.elements.wrapper) {
      this.scroll.limit =
        this.elements.wrapper.clientHeight - window.innerHeight;
    }
    each(this.animations, (animation) => {
      animation.onResize();
    });
  }
  /**
   * Loops
   */

  update() {
    this.scroll.target = GSAP.utils.clamp(
      0,
      this.scroll.limit,
      this.scroll.target
    );

    this.scroll.current = GSAP.utils.interpolate(
      this.scroll.current,
      this.scroll.target,
      0.1
    );
    if (this.scroll.current < 0.01) {
      this.scroll.current = 0;
    }
    if (this.elements.wrapper) {
      this.elements.wrapper.style[
        this.transformPrefix
      ] = `translateY(-${this.scroll.current}px)`;
    }
  }

  onContextMenu(event) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }

  /**
   * Listeners
   */
  addEventListeners() {
    window.addEventListener("resize", this.onResize, { passive: true });
    window.addEventListener("mousedown", this.onTouchDown, { passive: true });
    window.addEventListener("mousemove", this.onTouchMove, { passive: true });
    window.addEventListener("mouseup", this.onTouchUp, { passive: true });
    window.addEventListener("touchstart", this.onTouchDown, { passive: true });
    window.addEventListener("touchmove", this.onTouchMove, { passive: true });
    window.addEventListener("touchend", this.onTouchUp, { passive: true });

    window.addEventListener("mousewheel", this.onWheel.bind(this));
    window.addEventListener("wheel", this.onWheel.bind(this));
  }

  removeEventListeners() {
    window.removeEventListener("mousewheel", this.onWheel);

    window.removeEventListener("resize", this.onResize);

    window.removeEventListener("mousedown", this.onTouchDown);
    window.removeEventListener("mousemove", this.onTouchMove);
    window.removeEventListener("mouseup", this.onTouchUp);

    window.removeEventListener("touchstart", this.onTouchDown);
    window.removeEventListener("touchmove", this.onTouchMove);
    window.removeEventListener("touchend", this.onTouchUp);

    window.removeEventListener("wheel", this.onWheel);

    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("focusin", this.onFocusIn);
  }

  /**
   * Destroy
   */
  destroy() {
    this.removeEventListeners();
  }
}
