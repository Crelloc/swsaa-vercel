import AutoBind from "auto-bind";
import Prefix from "prefix";

import Component from "classes/Component";
export default class Animation extends Component {
  constructor({ element, elements }) {
    super({
      element,
      elements,
    });
    this.createObserver();
    this.animateOut();
  }
  createObserver() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.animateIn();
        } else {
          this.animateOut();
        }
      });
    });

    this.observer.observe(this.element);
  }

  animateIn() {}

  animateOut() {}

  onResize() {}
}
// export default class {
//   constructor ({ element, elements }) {
//     AutoBind(this)

//     const { animationDelay, animationTarget } = element.dataset

//     this.delay = animationDelay

//     this.element = element
//     this.elements = elements

//     this.target = animationTarget ? element.closest(animationTarget) : element
//     this.transformPrefix = Prefix('transform')

//     this.isVisible = false

//     if ('IntersectionObserver' in window) {
//       this.createObserver()

//       this.animateOut()
//     } else {
//       this.animateIn()
//     }
//   }

//   createObserver () {
//     this.observer = new window.IntersectionObserver((entries) => {
//       entries.forEach(entry => {
//         if (!this.isVisible && entry.isIntersecting) {
//           this.animateIn()
//         } else {
//           this.animateOut()
//         }
//       })
//     }).observe(this.target)
//   }

//   animateIn () {
//     this.isVisible = true
//   }

//   animateOut () {
//     this.isVisible = false
//   }
// }
