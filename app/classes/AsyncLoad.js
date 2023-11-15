import Component from "classes/Component";

export default class AsyncLoad extends Component {
  constructor({ element }) {
    super({ element });

    this.createObserver();
  }

  createObserver() {
    this.observer = new window.IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!this.element.src) {
            this.element.onload = (_) => {
              this.element.classList.add("loaded");
              console.log("firefox detected");
            };
            this.element.src = this.element.getAttribute("data-src");
          }
        }
      });
    });

    this.observer.observe(this.element);
  }
}
