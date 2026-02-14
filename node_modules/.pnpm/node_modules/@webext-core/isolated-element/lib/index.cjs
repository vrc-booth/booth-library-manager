"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/index.ts
var src_exports = {};
__export(src_exports, {
  createIsolatedElement: () => createIsolatedElement
});
module.exports = __toCommonJS(src_exports);
var import_is_potential_custom_element_name = __toESM(require("is-potential-custom-element-name"), 1);
var ALLOWED_SHADOW_ELEMENTS = [
  "article",
  "aside",
  "blockquote",
  "body",
  "div",
  "footer",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "main",
  "nav",
  "p",
  "section",
  "span"
];
function createIsolatedElement(options) {
  return __async(this, null, function* () {
    const { name, mode = "closed", css, isolateEvents = false } = options;
    if (!ALLOWED_SHADOW_ELEMENTS.includes(name) && !(0, import_is_potential_custom_element_name.default)(name)) {
      throw Error(
        `"${name}" cannot have a shadow root attached to it. It must be two words and kebab-case, with a few exceptions. See https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow#elements_you_can_attach_a_shadow_to`
      );
    }
    const parentElement = document.createElement(name);
    const shadow = parentElement.attachShadow({ mode });
    const isolatedElement = document.createElement("html");
    const body = document.createElement("body");
    const head = document.createElement("head");
    if (css) {
      const style = document.createElement("style");
      if ("url" in css) {
        style.textContent = yield fetch(css.url).then((res) => res.text());
      } else {
        style.textContent = css.textContent;
      }
      head.appendChild(style);
    }
    isolatedElement.appendChild(head);
    isolatedElement.appendChild(body);
    shadow.appendChild(isolatedElement);
    if (isolateEvents) {
      const eventTypes = Array.isArray(isolateEvents) ? isolateEvents : ["keydown", "keyup", "keypress"];
      eventTypes.forEach((eventType) => {
        body.addEventListener(eventType, (e) => e.stopPropagation());
      });
    }
    return {
      parentElement,
      shadow,
      isolatedElement: body
    };
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createIsolatedElement
});
