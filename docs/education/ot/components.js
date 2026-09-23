(() => {
    const C = { bg: '#f3f9ff', ink: '#102b50', muted: '#526f8e', accent: '#2563eb', line: '#bed4e9', paper: '#ffffff', bright: '#79caff', darkMuted: '#afc8df' };
    const TYPE_SCALE = { display: 104, closing: 88, title: 58, concept: 52, roadmapTitle: 34, roadmapBody: 25, heading: 40, body: 30, label: 24, micro: 18 };
    const SPACING = { edge: 80, top: 56, body: 370 };
    function BrandMark() { return React.createElement("div", { className: "brand" },
        "CREAI",
        React.createElement("span", null, "+"),
        "IT ",
        React.createElement("small", null, "EDU")); }
    function SlideFrame({ children, dark = false, label = '' }) { return React.createElement("article", { className: `slide ${dark ? 'dark' : ''}` },
        React.createElement("header", { className: "chrome" },
            React.createElement(BrandMark, null),
            React.createElement("span", null, label)),
        children); }
    function SlideTitle({ children, hero = false }) { return React.createElement("h1", { className: hero ? 'heroTitle' : 'title' }, children); }
    function BodyText({ children, className = '' }) { return React.createElement("p", { className: `bodyText ${className}` }, children); }
    function Connector({ children, dark = false, label, viewBox = '0 0 1440 420' }) { return React.createElement("svg", { className: "connectors", viewBox: viewBox, preserveAspectRatio: "none", role: "img", "aria-label": label },
        React.createElement("defs", null,
            React.createElement("marker", { id: dark ? 'arrowDark' : 'arrow', markerWidth: "12", markerHeight: "12", refX: "9", refY: "5", orient: "auto", markerUnits: "userSpaceOnUse" },
                React.createElement("path", { d: "M1 1L9 5L1 9", fill: "none", stroke: dark ? C.bright : C.accent, strokeWidth: "2" }))),
        children); }
    Object.assign(window, { C, TYPE_SCALE, SPACING, BrandMark, SlideFrame, SlideTitle, BodyText, Connector });
})();
