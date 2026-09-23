(() => {
    const C = { bg: '#f3f9ff', ink: '#102b50', muted: '#526f8e', accent: '#2563eb', line: '#bed4e9', paper: '#ffffff', bright: '#79caff', darkMuted: '#afc8df' };
    const TYPE_SCALE = { display: 96, title: 56, heading: 40, body: 30, label: 24, micro: 18, metric: 164 };
    const SPACING = { edge: 80, top: 56, body: 350 };
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
    function SlideTitle({ children }) { return React.createElement("h1", { className: "title" }, children); }
    function SourceNote({ href, children }) { return React.createElement("a", { className: "source", href: href, target: "_blank", rel: "noreferrer" },
        children,
        " \u2197"); }
    function BottomLine({ children }) { return React.createElement("p", { className: "bottomLine" }, children); }
    function Flow({ items }) { return React.createElement("div", { className: "flow" }, items.map(([title, body], i) => React.createElement(React.Fragment, { key: title },
        i > 0 && React.createElement("span", { className: "flowArrow" }, "\u2192"),
        React.createElement("div", { className: "flowStep" },
            React.createElement("h2", null, title),
            body && React.createElement("p", null, body))))); }
    function SourceLinks({ children }) { return React.createElement("div", { className: "sourceLinks" }, children); }
    function Walkthrough({ label, title, request, steps, watch, dark = false }) { return React.createElement(SlideFrame, { dark: dark, label: label },
        React.createElement(SlideTitle, null, title),
        React.createElement("div", { className: "walkthrough" },
            React.createElement("div", { className: "request" },
                React.createElement("span", { className: "eyebrow" }, "\uD568\uAED8 \uC785\uB825\uD560 \uC694\uCCAD"),
                React.createElement("blockquote", null, request)),
            React.createElement("div", { className: "watch" },
                React.createElement("span", { className: "eyebrow" }, "\uD654\uBA74\uC5D0\uC11C \uBCFC \uAC83"),
                watch.map(([a, b]) => React.createElement("div", { key: a },
                    React.createElement("h2", null, a),
                    React.createElement("p", null, b))))),
        React.createElement("div", { className: "walkSteps" }, steps.map((s, i) => React.createElement(React.Fragment, { key: s },
            i > 0 && React.createElement("span", null, "\u2192"),
            React.createElement("strong", null, s))))); }
    Object.assign(window, { C, TYPE_SCALE, SPACING, BrandMark, SlideFrame, SlideTitle, SourceNote, BottomLine, Flow, SourceLinks, Walkthrough });
})();
