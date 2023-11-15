import NormalizeWheel from "normalize-wheel";
import each from "lodash/each";

import Canvas from "components/Canvas";
import Navigation from "components/Navigation";
import Preloader from "components/Preloader";
import Transition from "components/Transition";

import About from "./pages/About";
import Collections from "./pages/Collections";
import Detail from "./pages/Detail";
import Home from "./pages/Home";

class App {
  constructor() {
    this.createContent();
    this.createPreloader();
    this.createCanvas();
    this.createTransition();
    this.createNavigation();
    this.createPages();

    this.addEventListeners();
    this.addLinkListeners();

    this.onResize();

    this.update();
  }

  createNavigation() {
    this.navigation = new Navigation({
      template: this.template,
    });
  }

  createCanvas() {
    this.canvas = new Canvas({
      template: this.template,
    });
  }

  createTransition() {
    this.transition = new Transition();
  }

  createPreloader() {
    this.preloader = new Preloader();
    this.preloader.once("completed", this.onPreloaded.bind(this));
  }

  createContent() {
    this.content = document.querySelector(".content");
    this.template = this.content.getAttribute("data-template");
  }

  createPages() {
    this.pages = {
      about: new About(),
      collections: new Collections(),
      detail: new Detail(),
      home: new Home(),
    };
    this.page = this.pages[this.template];
    this.page.create();
  }

  /**
   * Events.
   */
  onPreloaded() {
    this.onResize();

    this.preloader.destroy();
    this.canvas.onPreloaded();

    document.querySelector(".navigation").style.display = "block";
    this.page.show();
  }

  onPopState() {
    this.onChange({
      url: window.location.pathname,
      push: false,
    });
  }

  async onChange({ url, push = true }) {
    document.querySelector(".navigation").style.display = "none";
    this.canvas.onChangeStart(this.template);

    await this.page.hide();
    const request = await window.fetch(url);

    if (request.status === 200) {
      const html = await request.text();
      // console.log(html);
      const div = document.createElement("div");
      if (push) {
        window.history.pushState({}, "", url);
      }
      div.innerHTML = html;

      const divContent = div.querySelector(".content");

      this.template = divContent.getAttribute("data-template");
      this.navigation.onChange(this.template);

      this.content.setAttribute("data-template", this.template);
      this.content.innerHTML = divContent.innerHTML;
      this.canvas.onChangeEnd(this.template);

      this.page = this.pages[this.template];
      this.page.create();
      this.onResize();
      document.querySelector(".navigation").style.display = "block";
      this.page.show();
      this.addLinkListeners();
    } else {
      console.log("error");
    }
  }

  onResize() {
    if (this.page && this.page.onResize) {
      this.page.onResize();
    }

    window.requestAnimationFrame((_) => {
      if (this.canvas && this.canvas.onResize) {
        this.canvas.onResize();
      }
    });
  }

  onTouchDown(event) {
    if (this.canvas && this.canvas.onTouchDown) {
      this.canvas.onTouchDown(event);
    }

    if (this.page && this.page.onTouchDown) {
      this.page.onTouchDown(event);
    }
  }

  onTouchMove(event) {
    if (this.canvas && this.canvas.onTouchMove) {
      this.canvas.onTouchMove(event);
    }

    if (this.page && this.page.onTouchDown) {
      this.page.onTouchMove(event);
    }
  }

  onTouchUp(event) {
    if (this.canvas && this.canvas.onTouchUp) {
      this.canvas.onTouchUp(event);
    }

    if (this.page && this.page.onTouchDown) {
      this.page.onTouchUp(event);
    }
  }

  onWheel(event) {
    const normalizedWheel = NormalizeWheel(event);

    if (this.canvas && this.canvas.onWheel) {
      this.canvas.onWheel(normalizedWheel);
    }

    if (this.page && this.page.onWheel) {
      this.page.onMouseWheel(normalizedWheel);
    }
  }

  onWheelFirefox(event) {
    const normalizedWheel = NormalizeWheel(event);

    if (this.canvas && this.canvas.onWheel) {
      this.canvas.onWheel(normalizedWheel);
    }

    if (this.page && this.page.onWheel) {
      this.page.onWheel(normalizedWheel);
    }
  }

  onContextMenu(event) {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }

  onKeyDown(event) {
    if (event.key === "Tab") {
      event.preventDefault();
    }

    if (event.key === "ArrowDown") {
      this.page.scroll.target += 100;
    } else if (event.key === "ArrowUp") {
      this.page.scroll.target -= 100;
    }
  }

  onFocusIn(event) {
    event.preventDefault();
  }

  // /**
  //  * Loop.
  //  */
  update() {
    if (this.page && this.page.update) {
      this.page.update();
    }
    if (this.canvas && this.canvas.update) {
      this.canvas.update(this.page.scroll);
    }
    this.frame = window.requestAnimationFrame(this.update.bind(this));
  }

  /***
   * Listeners.
   */
  addEventListeners() {
    window.addEventListener("keydown", this.onKeyDown.bind(this));
    window.addEventListener("focusin", this.onFocusIn.bind(this));

    window.oncontextmenu = this.onContextMenu;

    window.addEventListener("popstate", this.onPopState.bind(this));
    window.removeEventListener("mousewheel", this.onMouseWheelEvent);
    window.addEventListener("wheel", this.onWheel.bind(this));

    window.addEventListener("mousedown", this.onTouchDown.bind(this));
    window.addEventListener("mousemove", this.onTouchMove.bind(this));
    window.addEventListener("mouseup", this.onTouchUp.bind(this));

    window.addEventListener("touchstart", this.onTouchDown.bind(this));
    window.addEventListener("touchmove", this.onTouchMove.bind(this));
    window.addEventListener("touchend", this.onTouchUp.bind(this));

    window.addEventListener("resize", this.onResize.bind(this));
  }

  addLinkListeners() {
    const links = document.querySelectorAll("a");
    // console.log(links);
    each(links, (link) => {
      link.onclick = (event) => {
        const isLocal = link.href.indexOf(window.location.origin) > -1;
        const isNotEmail = link.href.indexOf("mailto") === -1;
        const isNotPhone = link.href.indexOf("tel") === -1;

        if (isLocal) {
          event.preventDefault();
          const { href } = link;
          this.onChange({ url: href });
        } else if (isNotEmail && isNotPhone) {
          link.rel = "noopener";
          link.target = "_blank";
        }
      };
    });
  }
  // addLinkListeners() {
  //   const links = document.querySelectorAll("a");

  //   each(links, (link) => {
  //     const isLocal = link.href.indexOf(window.location.origin) > -1;

  //     const isNotEmail = link.href.indexOf("mailto") === -1;
  //     const isNotPhone = link.href.indexOf("tel") === -1;

  //     if (isLocal) {
  //       link.onclick = (event) => {
  //         event.preventDefault();

  //         this.onChange({
  //           url: link.href,
  //         });
  //       };

  //       link.onmouseenter = (event) => this.onLinkMouseEnter(link);
  //       link.onmouseleave = (event) => this.onLinkMouseLeave(link);
  //     } else if (isNotEmail && isNotPhone) {
  //       link.rel = "noopener";
  //       link.target = "_blank";
  //     }
  //   });
  // }
}

new App();
