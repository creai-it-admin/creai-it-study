// CREAI+IT HTML system. Theme tokens and shared primitives precede all slides.
const C = {
  ink: 'var(--ink)',
  accent: 'var(--blue)',
  paper: 'var(--paper)'
};
function BrandMark() {
  return /*#__PURE__*/React.createElement("div", {
    className: "brand"
  }, "CREAI", /*#__PURE__*/React.createElement("b", null, "+"), "IT");
}
function SlideFrame({
  children,
  variant = ''
}) {
  return /*#__PURE__*/React.createElement("article", {
    className: 'slide ' + variant
  }, /*#__PURE__*/React.createElement("header", {
    className: "chrome"
  }, /*#__PURE__*/React.createElement(BrandMark, null), /*#__PURE__*/React.createElement("span", {
    className: "meta"
  }, "AI STUDY \xB7 OUR DIRECTION")), children);
}
function Heading({
  eyebrow,
  title,
  children
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, eyebrow), /*#__PURE__*/React.createElement("h1", {
    className: "title"
  }, title), children && /*#__PURE__*/React.createElement("p", {
    className: "subtitle"
  }, children));
}
function Takeaway({
  children
}) {
  return /*#__PURE__*/React.createElement("p", {
    className: "takeaway"
  }, children);
}
function Scope({
  personal = false,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: 'scope-label' + (personal ? ' personal' : '')
  }, children);
}
function Node({
  code,
  title,
  children
}) {
  return /*#__PURE__*/React.createElement("section", {
    className: "tree-node"
  }, /*#__PURE__*/React.createElement("h3", null, /*#__PURE__*/React.createElement("span", {
    className: "code"
  }, code), title), children);
}
Object.assign(window, {
  C,
  BrandMark,
  SlideFrame,
  Heading,
  Takeaway,
  Scope,
  Node
});