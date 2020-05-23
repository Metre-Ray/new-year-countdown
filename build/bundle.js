
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function xlink_attr(node, attribute, value) {
        node.setAttributeNS('http://www.w3.org/1999/xlink', attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.22.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\NewYearTree.svelte generated by Svelte v3.22.2 */
    const file = "src\\NewYearTree.svelte";

    function create_fragment(ctx) {
    	let svg;
    	let path0;
    	let path1;
    	let path2;
    	let path3;
    	let path4;
    	let path5;
    	let path6;
    	let path7;
    	let path8;
    	let path9;
    	let path10;
    	let path11;
    	let path12;
    	let path13;
    	let path14;
    	let path15;
    	let path16;
    	let path17;
    	let path18;
    	let path19;
    	let path20;
    	let path21;
    	let path22;
    	let path23;
    	let path24;
    	let path25;
    	let path26;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			path3 = svg_element("path");
    			path4 = svg_element("path");
    			path5 = svg_element("path");
    			path6 = svg_element("path");
    			path7 = svg_element("path");
    			path8 = svg_element("path");
    			path9 = svg_element("path");
    			path10 = svg_element("path");
    			path11 = svg_element("path");
    			path12 = svg_element("path");
    			path13 = svg_element("path");
    			path14 = svg_element("path");
    			path15 = svg_element("path");
    			path16 = svg_element("path");
    			path17 = svg_element("path");
    			path18 = svg_element("path");
    			path19 = svg_element("path");
    			path20 = svg_element("path");
    			path21 = svg_element("path");
    			path22 = svg_element("path");
    			path23 = svg_element("path");
    			path24 = svg_element("path");
    			path25 = svg_element("path");
    			path26 = svg_element("path");
    			attr_dev(path0, "d", "M622.445-391.7c8.43 22.57 13.726 29.975 31.435 35.15-4.983 6.312-9.062 9.913-11.721 9.254 8.445 14.291 24.243 19.248 38.32 25.653-6.588 5.554-13.131 10.885-18.58 10.742 8.303 20.348 19.797 15.17 30.226 18.506-5.418 11.43-18.817 15.606-37.012 15.422 9.484 14.702 20.768 28.604 61.07 29.61-.949 8.593-8.16 15.1-26.525 17.888 5.752 5.596 13.132 10.216 24.675 12.338-6.511 12.768-26.1 11.268-45.032 10.486 2.865 7.784 9.85 12.271 18.506 15.422-4.092 7.238-10.312 10.22-17.889 10.487 13.48 21.638 30.018 14.217 45.648 15.422-6.012 17.626-17.26 20.596-28.993 22.207 3.786 3.507 7.141 5.82 15.422 12.698l-5.115 8.095-8.456-1.67c8.831 31.75 23.237 18.9 35.162 25.908 2.615.249-.101 4.496-6.786 11.72 8.99.913 18.004 1.876 24.725-1.749-.41 14.092-9.2 20.502-23.554 21.81 4.05 7.66 9.204 9.811 14.394 11.777-6.688 10.147-13.377 6.507-20.065 6.98 21.298 19.59 47.655 22.314 75.897 18.755-4.964 14.782-11.213 28.198-34.459 23.555 4.183 6.792 9.333 13.22 22.682 16.575-14.394 16.305-29.66 12.512-44.055 3.49 3.457 6.47 3.097 11.027 16.14 19.628-6.52 15.132-19.833 6.486-30.534 6.98 8.396 10.403 20.005 18.91 53.651 14.393 3.188.777 1.9 4.75-3.053 11.341 17.302 7.173 34.604 1.33 51.907-3.925-2.685 28.812-21.805 29.167-31.842 34.023-7.997 1.828-15.994-.228-23.99-1.745 4.253 9.683 14.045 14.934 23.99 20.065-18.466 17.701-36.931 4.114-55.397.436-.333 6.142 2.666 12.76 10.469 20.065-21.737 4.952-34.462-2.486-47.109-10.033-4.65 3.927-1.616 10.415.436 16.576-8.813 6.44-18.35-3.532-35.331-16.576-6.557 5.816-8.924 11.632-10.905 17.448-1.749 6.45-13.232-9.35-22.682-20.501l-11.777 23.118-12.213-22.682c-6.293 13.278-13.203 22.854-21.81 22.246l-10.032-20.065c-11.923 16.197-23.41 16.208-35.332 19.192.31-6.436 1.185-14 .437-18.32-17.227 11.339-30.696 12.318-47.11 8.288 3.764-6.736 11.032-15.575 9.597-19.192-18.352 4.414-34.919 18.196-57.577 0 8.87-3.754 17.738-5.845 26.608-19.629-21.872 3.756-43.82 8.02-58.886-33.587 17.747 2.941 31.398 12.711 55.396 5.235-2.011-3.66-4.937-6.404-4.798-12.214 13.503.705 33.722 4.135 40.02-.591 6.575-4.934 10.297-5.743 14.068-10.75-11.487 3.546-22.973 3.205-34.46-8.287 7.124-7.053 20.755-10.038 19.63-22.246-10.225 1.305-19.8 12.65-42.748-.872 8.003-5.342 18.07-10.168 21.81-16.576-11.51-4.996-24.187 1.678-33.587-24.426 30.414-.651 60.534-1.576 75.025-17.012-8.36-.944-16.051-4.304-18.756-10.905 7.235-2.295 11.651-3.532 13.086-10.468-13.349.312-21.981-6.713-24.863-22.682 7.915 2.304 14.104 5.99 27.48 3.926-4.569-3.916-10.388-7.623-8.288-12.65 16.434-4.007 29.5-7.616 39.257-25.735-6.985-2.763-11.184-5.525-13.522-8.288l13.086-10.905c-9.842-3.11-18.335 3.668-31.406-23.118 15.256-2.267 28.082 8.834 47.545-16.575-6.668-1.265-14.854 1.516-18.32-8.288 9.221-4.286 17.719-9.176 20.065-19.192-20.545 7.309-36.727 5.94-47.981-5.234 9.337-4.117 22.048-6.884 26.171-13.086-10.724-2.633-22.097-3.642-28.352-17.448 32.008-1.797 55.186-10.742 62.811-32.278-14.654 2.675-28.435 2.877-36.203-13.958 10.982-3.157 22.85-3.069 30.533-18.32-9.031.393-14.795-4.933-19.192-12.65 12.504-3.174 25.008-4.43 37.512-24.426-3.72-1.615-7.834-1.251-10.469-8.288 19.719-8.053 27.909-27.633 36.204-47.109z");
    			attr_dev(path0, "fill", "none");
    			attr_dev(path0, "stroke", "#000");
    			attr_dev(path0, "transform", "matrix(1.42261 0 0 1.34443 -536.082 582.955)");
    			add_location(path0, file, 25, 2, 565);
    			attr_dev(path1, "class", "star svelte-1slgqa1");
    			attr_dev(path1, "d", "M356.916 62.615l-14.514-16.257-18.449 9.965 14.413-16.37-8.834-20.81L344.046 35.4l18.448-9.965-14.412 16.371z");
    			add_location(path1, file, 26, 2, 3767);
    			attr_dev(path2, "class", "star svelte-1slgqa1");
    			attr_dev(path2, "d", "M325.456 174.268l-14.514-16.257-18.449 9.965 14.413-16.37-8.835-20.81 14.515 16.257 18.448-9.965-14.413 16.371z");
    			add_location(path2, file, 27, 2, 3905);
    			attr_dev(path3, "class", "star svelte-1slgqa1");
    			attr_dev(path3, "d", "M388.377 173.034l-14.514-16.256-18.448 9.965 14.413-16.37-8.835-20.81 14.514 16.257 18.449-9.965-14.413 16.371z");
    			add_location(path3, file, 28, 2, 4045);
    			attr_dev(path4, "class", "star svelte-1slgqa1");
    			attr_dev(path4, "d", "M215.936 274.873l-14.514-16.257-18.449 9.965 14.413-16.37-8.834-20.81 14.514 16.257 18.448-9.965-14.412 16.371z");
    			add_location(path4, file, 29, 2, 4185);
    			attr_dev(path5, "class", "star svelte-1slgqa1");
    			attr_dev(path5, "d", "M501.32 273.056L486.805 256.8l-18.448 9.965 14.413-16.372-8.834-20.809 14.515 16.257 18.448-9.965-14.413 16.372z");
    			add_location(path5, file, 30, 2, 4325);
    			attr_dev(path6, "class", "star svelte-1slgqa1");
    			attr_dev(path6, "d", "M327.923 255.694l-14.514-16.256-18.448 9.964 14.412-16.37-8.834-20.81 14.514 16.257 18.45-9.965-14.414 16.372z");
    			add_location(path6, file, 31, 2, 4466);
    			attr_dev(path7, "class", "star svelte-1slgqa1");
    			attr_dev(path7, "d", "M384.675 311.213l-14.514-16.257-18.449 9.964 14.413-16.37-8.834-20.81 14.514 16.257 18.448-9.965-14.412 16.372z");
    			add_location(path7, file, 32, 2, 4605);
    			attr_dev(path8, "class", "star svelte-1slgqa1");
    			attr_dev(path8, "d", "M316.82 351.926l-14.515-16.258-18.448 9.965 14.413-16.372-8.834-20.808 14.515 16.256 18.448-9.964-14.413 16.37z");
    			add_location(path8, file, 33, 2, 4745);
    			attr_dev(path9, "class", "star svelte-1slgqa1");
    			attr_dev(path9, "d", "M390.844 398.808l-14.514-16.257-18.449 9.965 14.413-16.372-8.835-20.808 14.515 16.256 18.448-9.964-14.413 16.37z");
    			add_location(path9, file, 34, 2, 4885);
    			attr_dev(path10, "class", "star svelte-1slgqa1");
    			attr_dev(path10, "d", "M311.886 441.988l-14.514-16.256-18.45 9.964 14.413-16.37-8.834-20.81 14.515 16.257 18.448-9.965-14.413 16.372z");
    			add_location(path10, file, 35, 2, 5026);
    			attr_dev(path11, "class", "star svelte-1slgqa1");
    			attr_dev(path11, "d", "M395.78 479l-14.515-16.256-18.449 9.964 14.413-16.37-8.835-20.81 14.515 16.257 18.448-9.965-14.413 16.372z");
    			add_location(path11, file, 36, 2, 5165);
    			attr_dev(path12, "class", "star svelte-1slgqa1");
    			attr_dev(path12, "d", "M313.12 517.246l-14.516-16.257-18.448 9.965 14.413-16.37-8.835-20.81 14.515 16.257 18.449-9.965-14.413 16.371z");
    			add_location(path12, file, 37, 2, 5300);
    			attr_dev(path13, "class", "star svelte-1slgqa1");
    			attr_dev(path13, "d", "M398.247 545.622l-14.514-16.257-18.448 9.965 14.412-16.37-8.834-20.81 14.514 16.257 18.449-9.965-14.413 16.371z");
    			add_location(path13, file, 38, 2, 5439);
    			attr_dev(path14, "class", "star svelte-1slgqa1");
    			attr_dev(path14, "d", "M61.732 683.071l-14.514-16.257-18.449 9.965 14.413-16.37-8.835-20.81 14.515 16.257 18.448-9.965-14.413 16.371z");
    			add_location(path14, file, 39, 2, 5579);
    			attr_dev(path15, "class", "star svelte-1slgqa1");
    			attr_dev(path15, "d", "M645.652 684.244l-14.514-16.257-18.449 9.965 14.413-16.372-8.834-20.808 14.514 16.256 18.448-9.964-14.413 16.37z");
    			add_location(path15, file, 40, 2, 5718);
    			attr_dev(path16, "class", "star svelte-1slgqa1");
    			attr_dev(path16, "d", "M197.147 717.111l-14.514-16.257-18.448 9.965 14.413-16.37-8.835-20.81 14.514 16.257 18.45-9.965-14.414 16.371z");
    			add_location(path16, file, 41, 2, 5859);
    			attr_dev(path17, "class", "star svelte-1slgqa1");
    			attr_dev(path17, "d", "M295.846 724.514l-14.514-16.257-18.448 9.965 14.412-16.372-8.834-20.808 14.514 16.256 18.45-9.964-14.414 16.37z");
    			add_location(path17, file, 42, 2, 5998);
    			attr_dev(path18, "class", "star svelte-1slgqa1");
    			attr_dev(path18, "d", "M408.117 724.514l-14.514-16.257-18.45 9.965 14.413-16.372-8.833-20.808 14.514 16.256 18.448-9.964-14.412 16.37z");
    			add_location(path18, file, 43, 2, 6138);
    			attr_dev(path19, "class", "star svelte-1slgqa1");
    			attr_dev(path19, "d", "M494.478 722.046l-14.515-16.257-18.448 9.965 14.414-16.37-8.835-20.81 14.514 16.257 18.449-9.965-14.414 16.372z");
    			add_location(path19, file, 44, 2, 6278);
    			attr_dev(path20, "class", "star svelte-1slgqa1");
    			attr_dev(path20, "d", "M116.03 567.5l-14.514-16.256-18.448 9.964 14.413-16.37-8.835-20.81 14.514 16.257 18.45-9.965-14.414 16.372z");
    			add_location(path20, file, 45, 2, 6418);
    			attr_dev(path21, "class", "star svelte-1slgqa1");
    			attr_dev(path21, "d", "M594.053 565.06l-14.513-16.257-18.45 9.964 14.413-16.37-8.835-20.81 14.515 16.257 18.448-9.965-14.413 16.372z");
    			add_location(path21, file, 46, 2, 6554);
    			attr_dev(path22, "class", "star svelte-1slgqa1");
    			attr_dev(path22, "d", "M310.652 591.27l-14.515-16.257-18.449 9.965 14.413-16.37-8.834-20.81 14.514 16.257 18.448-9.965-14.412 16.372z");
    			add_location(path22, file, 47, 2, 6692);
    			attr_dev(path23, "class", "star svelte-1slgqa1");
    			attr_dev(path23, "d", "M467.335 599.906l-14.514-16.256-18.448 9.964 14.412-16.37-8.834-20.81 14.514 16.257 18.45-9.965-14.414 16.372z");
    			add_location(path23, file, 48, 2, 6831);
    			attr_dev(path24, "class", "star svelte-1slgqa1");
    			attr_dev(path24, "d", "M227.991 592.504l-14.514-16.257-18.449 9.965 14.413-16.37-8.835-20.81 14.515 16.257 18.448-9.965-14.413 16.371z");
    			add_location(path24, file, 49, 2, 6970);
    			attr_dev(path25, "class", "star svelte-1slgqa1");
    			attr_dev(path25, "d", "M394.546 639.386l-14.514-16.257-18.45 9.965 14.413-16.37-8.834-20.81 14.514 16.257 18.448-9.965-14.412 16.371z");
    			add_location(path25, file, 50, 2, 7110);
    			attr_dev(path26, "class", "star svelte-1slgqa1");
    			attr_dev(path26, "d", "M279.809 650.49l-14.515-16.257-18.448 9.965 14.413-16.372-8.835-20.809 14.515 16.257 18.448-9.965-14.413 16.372z");
    			add_location(path26, file, 51, 2, 7249);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 680 800");
    			add_location(svg, file, 24, 0, 499);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    			append_dev(svg, path2);
    			append_dev(svg, path3);
    			append_dev(svg, path4);
    			append_dev(svg, path5);
    			append_dev(svg, path6);
    			append_dev(svg, path7);
    			append_dev(svg, path8);
    			append_dev(svg, path9);
    			append_dev(svg, path10);
    			append_dev(svg, path11);
    			append_dev(svg, path12);
    			append_dev(svg, path13);
    			append_dev(svg, path14);
    			append_dev(svg, path15);
    			append_dev(svg, path16);
    			append_dev(svg, path17);
    			append_dev(svg, path18);
    			append_dev(svg, path19);
    			append_dev(svg, path20);
    			append_dev(svg, path21);
    			append_dev(svg, path22);
    			append_dev(svg, path23);
    			append_dev(svg, path24);
    			append_dev(svg, path25);
    			append_dev(svg, path26);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	onMount(() => {
    		animateStars();
    	});

    	const animateStars = () => {
    		let stars = Array.from(document.querySelectorAll(".star"));

    		if (stars) {
    			shuffle(stars);

    			for (let i = 0; i < stars.length; i++) {
    				setTimeout(
    					() => {
    						stars[i].classList.add("star-animated");
    					},
    					2000 * i + Math.random() * 1000
    				);
    			}
    		}
    	};

    	const shuffle = array => {
    		array.sort(() => 0.5 - Math.random());
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<NewYearTree> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("NewYearTree", $$slots, []);
    	$$self.$capture_state = () => ({ onMount, animateStars, shuffle });
    	return [];
    }

    class NewYearTree extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NewYearTree",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.22.2 */
    const file$1 = "src\\App.svelte";

    function create_fragment$1(ctx) {
    	let link;
    	let t0;
    	let main;
    	let div3;
    	let div0;
    	let svg0;
    	let path0;
    	let t1;
    	let div1;
    	let svg1;
    	let use0;
    	let t2;
    	let div2;
    	let svg2;
    	let use1;
    	let t3;
    	let svg3;
    	let path1;
    	let t4;
    	let h1;
    	let t6;
    	let div4;
    	let t7;
    	let t8;
    	let t9;
    	let t10;
    	let t11;
    	let t12;
    	let t13;
    	let t14;
    	let div5;
    	let current;
    	let dispose;
    	const newyeartree = new NewYearTree({ $$inline: true });

    	const block = {
    		c: function create() {
    			link = element("link");
    			t0 = space();
    			main = element("main");
    			div3 = element("div");
    			div0 = element("div");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t1 = space();
    			div1 = element("div");
    			svg1 = svg_element("svg");
    			use0 = svg_element("use");
    			t2 = space();
    			div2 = element("div");
    			svg2 = svg_element("svg");
    			use1 = svg_element("use");
    			t3 = space();
    			svg3 = svg_element("svg");
    			path1 = svg_element("path");
    			t4 = space();
    			h1 = element("h1");
    			h1.textContent = "New Year Countdown!";
    			t6 = space();
    			div4 = element("div");
    			t7 = text(/*days*/ ctx[0]);
    			t8 = text(" days ");
    			t9 = text(/*hours*/ ctx[1]);
    			t10 = text(":");
    			t11 = text(/*minutes*/ ctx[2]);
    			t12 = text(":");
    			t13 = text(/*seconds*/ ctx[3]);
    			t14 = space();
    			div5 = element("div");
    			create_component(newyeartree.$$.fragment);
    			document.title = "New Year Countdown";
    			attr_dev(link, "href", "https://fonts.googleapis.com/css2?family=Charm:wght@400;700&display=swap");
    			attr_dev(link, "rel", "stylesheet");
    			add_location(link, file$1, 51, 1, 1283);
    			attr_dev(path0, "id", "a");
    			attr_dev(path0, "d", "M33.212 26.16l-3.054-1.764 1.84-1.062a.504.504 0 00.184-.684.502.502 0 00-.684-.183L29.16 23.82l-2.32-1.34 4.729-2.73a.502.502 0 \n\t\t\t\t\t00-.5-.867l-5.23 3.019-3.619-2.09 4.352-1.918-4.354-1.919 3.619-2.091 5.231 3.021a.504.504 0 00.685-.183.498.498 0 00-.184-.683l-4.731-2.732 \n\t\t\t\t\t2.32-1.34L31.5 13.32a.504.504 0 00.685-.184.498.498 0 00-.184-.682L30.16 11.39l3.052-1.762a.503.503 0 00.184-.684.503.503 0 00-.684-.184l-3.051 \n\t\t\t\t\t1.763-.001-2.122a.5.5 0 00-1 0l.001 2.699-2.32 1.34.001-5.46a.5.5 0 00-1 0l-.001 6.037-3.619 2.09.515-4.728-3.838 2.81V9.008l5.229-3.021a.504.504 \n\t\t\t\t\t0 00.184-.684.502.502 0 00-.684-.182l-4.729 2.73V5.173l2.339-1.352a.5.5 0 10-.5-.866L18.399 4.02V.5a.5.5 0 00-1 0v3.523L15.56 2.961a.502.502 0 \n\t\t\t\t\t00-.5.868l2.339 1.352v2.678l-4.729-2.73a.502.502 0 00-.5.868l5.229 3.02v4.184l-3.837-2.811.514 4.729-3.621-2.092V6.989a.5.5 0 00-1 \n\t\t\t\t\t0v5.462l-2.318-1.34-.001-2.701a.5.5 0 10-1 0l.001 2.125-3.053-1.764a.5.5 0 00-.5.867L5.636 11.4l-1.839 1.062a.501.501 0 00.501.868l2.339-1.351 2.319 \n\t\t\t\t\t1.339-4.729 2.73a.501.501 0 00.501.868l5.23-3.021 3.622 2.091-4.352 1.919 4.351 1.919-3.621 2.09-5.231-3.018a.497.497 0 00-.683.184.504.504 0 00.183.686l4.731 \n\t\t\t\t\t2.729-2.321 1.34-2.338-1.352a.502.502 0 00-.5.868l1.838 1.062-3.05 1.76a.501.501 0 00.501.869l3.051-1.763.001 2.121a.5.5 0 001 0l-.001-2.701 2.322-1.34-.002 \n\t\t\t\t\t5.463a.5.5 0 101 0l.002-6.041 3.619-2.09-.514 4.729 3.837-2.81v4.183l-5.228 3.021a.5.5 0 00.5.868l4.728-2.73v2.679l-2.339 1.353a.5.5 0 \n\t\t\t\t\t00.5.868l1.839-1.062v3.51c0 .274.224.5.5.5s.5-.226.5-.5v-3.524l1.841 1.062a.502.502 0 00.685-.184.5.5 0 00-.184-.684l-2.341-1.354v-2.678l4.729 2.73a.502.502 \n\t\t\t\t\t0 00.685-.184.5.5 0 00-.184-.684l-5.229-3.021V22.6l3.838 2.811-.514-4.729 3.62 2.09v6.039a.5.5 0 001 0V23.35l2.318 1.34.001 2.699c0 \n\t\t\t\t\t.275.225.5.5.5s.5-.225.5-.5l-.001-2.123 3.053 1.764a.503.503 0 00.685-.184.51.51 0 00-.193-.686zm-12.215-2.901l-2.6-1.901-.499-.363-.501.365-2.598 \n\t\t\t\t\t1.9.348-3.201.067-.615-.567-.25-2.945-1.299 2.946-1.299.566-.25-.067-.616-.348-3.2 2.598 1.901.5.364.5-.365 2.6-1.901-.349 3.201-.066.616.564.249 2.946 \n\t\t\t\t\t1.3-2.944 1.299-.566.25.066.615.349 3.2z");
    			add_location(path0, file$1, 64, 4, 1709);
    			attr_dev(svg0, "class", "snowflake svelte-1ya0fw1");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr_dev(svg0, "viewBox", "0 0 35.8 35.8");
    			add_location(svg0, file$1, 63, 3, 1579);
    			attr_dev(div0, "class", "svg-container svelte-1ya0fw1");
    			attr_dev(div0, "draggable", "true");
    			add_location(div0, file$1, 57, 2, 1449);
    			xlink_attr(use0, "xlink:href", "#a");
    			add_location(use0, file$1, 88, 4, 4156);
    			attr_dev(svg1, "class", "snowflake svelte-1ya0fw1");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr_dev(svg1, "viewBox", "0 0 35.8 35.8");
    			add_location(svg1, file$1, 87, 3, 4026);
    			attr_dev(div1, "class", "svg-container svelte-1ya0fw1");
    			attr_dev(div1, "draggable", "true");
    			add_location(div1, file$1, 81, 2, 3896);
    			xlink_attr(use1, "xlink:href", "#a");
    			add_location(use1, file$1, 98, 4, 4460);
    			attr_dev(svg2, "class", "snowflake svelte-1ya0fw1");
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr_dev(svg2, "viewBox", "0 0 35.8 35.8");
    			add_location(svg2, file$1, 97, 3, 4330);
    			attr_dev(div2, "class", "svg-container svelte-1ya0fw1");
    			attr_dev(div2, "draggable", "true");
    			add_location(div2, file$1, 91, 2, 4200);
    			attr_dev(div3, "class", "snowflakes-container svelte-1ya0fw1");
    			add_location(div3, file$1, 56, 1, 1412);
    			attr_dev(path1, "d", "m 156.29221,49.271953 -47.94022,84.101327 -4.56459,-43.01133 -3.31764,40.44043 -44.178169,-81.35266 37.91398,85.95031 -32.18926,-17.41393 29.90516,26.27489 -86.9223394,4.41678 84.7483094,4.17132 -26.62473,22.21156 31.84766,-15.44815 -41.26259,88.11555 47.951069,-84.11941 4.34134,40.90241 3.19413,-38.93302 44.51405,81.97225 -39.07874,-88.592 33.14112,17.92862 -27.60554,-24.25382 84.83566,-4.31085 -87.35642,-4.29948 29.01992,-24.2104 -30.28291,14.68902 z");
    			add_location(path1, file$1, 107, 2, 4639);
    			attr_dev(svg3, "class", "top-star svelte-1ya0fw1");
    			attr_dev(svg3, "xmlns:svg", "http://www.w3.org/2000/svg");
    			attr_dev(svg3, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg3, "viewBox", "0 0 210 297");
    			add_location(svg3, file$1, 103, 1, 4512);
    			attr_dev(h1, "class", "svelte-1ya0fw1");
    			add_location(h1, file$1, 110, 1, 5119);
    			attr_dev(div4, "class", "timer svelte-1ya0fw1");
    			add_location(div4, file$1, 111, 1, 5149);
    			attr_dev(div5, "class", "tree-container svelte-1ya0fw1");
    			add_location(div5, file$1, 115, 1, 5221);
    			attr_dev(main, "class", "svelte-1ya0fw1");
    			add_location(main, file$1, 55, 0, 1404);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			append_dev(document.head, link);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, div3);
    			append_dev(div3, div0);
    			append_dev(div0, svg0);
    			append_dev(svg0, path0);
    			append_dev(div3, t1);
    			append_dev(div3, div1);
    			append_dev(div1, svg1);
    			append_dev(svg1, use0);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, svg2);
    			append_dev(svg2, use1);
    			append_dev(main, t3);
    			append_dev(main, svg3);
    			append_dev(svg3, path1);
    			append_dev(main, t4);
    			append_dev(main, h1);
    			append_dev(main, t6);
    			append_dev(main, div4);
    			append_dev(div4, t7);
    			append_dev(div4, t8);
    			append_dev(div4, t9);
    			append_dev(div4, t10);
    			append_dev(div4, t11);
    			append_dev(div4, t12);
    			append_dev(div4, t13);
    			append_dev(main, t14);
    			append_dev(main, div5);
    			mount_component(newyeartree, div5, null);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(div0, "dragstart", /*onDragStart*/ ctx[4], false, false, false),
    				listen_dev(div0, "drag", /*onDrag*/ ctx[5], false, false, false),
    				listen_dev(div0, "dragend", /*onDragEnd*/ ctx[6], false, false, false),
    				listen_dev(div1, "dragstart", /*onDragStart*/ ctx[4], false, false, false),
    				listen_dev(div1, "drag", /*onDrag*/ ctx[5], false, false, false),
    				listen_dev(div1, "dragend", /*onDragEnd*/ ctx[6], false, false, false),
    				listen_dev(div2, "dragstart", /*onDragStart*/ ctx[4], false, false, false),
    				listen_dev(div2, "drag", /*onDrag*/ ctx[5], false, false, false),
    				listen_dev(div2, "dragend", /*onDragEnd*/ ctx[6], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*days*/ 1) set_data_dev(t7, /*days*/ ctx[0]);
    			if (!current || dirty & /*hours*/ 2) set_data_dev(t9, /*hours*/ ctx[1]);
    			if (!current || dirty & /*minutes*/ 4) set_data_dev(t11, /*minutes*/ ctx[2]);
    			if (!current || dirty & /*seconds*/ 8) set_data_dev(t13, /*seconds*/ ctx[3]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(newyeartree.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(newyeartree.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(link);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(newyeartree);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	const nyDate = new Date("2021-01-01T00:00:00");
    	let currentDate = new Date();
    	let diff = nyDate - currentDate;

    	setInterval(
    		() => {
    			currentDate = new Date();
    			$$invalidate(8, diff = nyDate - currentDate);
    		},
    		200
    	);

    	let element;
    	let startCoords;
    	let elementCoords;
    	let shiftX;
    	let shiftY;

    	function onDragStart(event) {
    		element = event.target;
    		const rect = element.getBoundingClientRect();
    		const img = new Image();
    		event.dataTransfer.setDragImage(img, 0, 0);
    		shiftX = event.clientX - rect.left;
    		shiftY = event.clientY - rect.top;
    		element.style.position = "absolute";
    		move(event);
    		return false;
    	}

    	function move(event) {
    		element.style.left = event.clientX - shiftX + "px";
    		element.style.top = event.clientY - shiftY + "px";
    	}

    	function onDrag(event) {
    		move(event);
    	}

    	function onDragEnd(event) {
    		move(event);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		NewYearTree,
    		nyDate,
    		currentDate,
    		diff,
    		element,
    		startCoords,
    		elementCoords,
    		shiftX,
    		shiftY,
    		onDragStart,
    		move,
    		onDrag,
    		onDragEnd,
    		days,
    		hours,
    		minutes,
    		seconds
    	});

    	$$self.$inject_state = $$props => {
    		if ("currentDate" in $$props) currentDate = $$props.currentDate;
    		if ("diff" in $$props) $$invalidate(8, diff = $$props.diff);
    		if ("element" in $$props) element = $$props.element;
    		if ("startCoords" in $$props) startCoords = $$props.startCoords;
    		if ("elementCoords" in $$props) elementCoords = $$props.elementCoords;
    		if ("shiftX" in $$props) shiftX = $$props.shiftX;
    		if ("shiftY" in $$props) shiftY = $$props.shiftY;
    		if ("days" in $$props) $$invalidate(0, days = $$props.days);
    		if ("hours" in $$props) $$invalidate(1, hours = $$props.hours);
    		if ("minutes" in $$props) $$invalidate(2, minutes = $$props.minutes);
    		if ("seconds" in $$props) $$invalidate(3, seconds = $$props.seconds);
    	};

    	let days;
    	let hours;
    	let minutes;
    	let seconds;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*diff*/ 256) {
    			 $$invalidate(0, days = Math.floor(diff / (1000 * 3600 * 24)));
    		}

    		if ($$self.$$.dirty & /*diff*/ 256) {
    			 $$invalidate(1, hours = Math.floor(diff % (1000 * 3600 * 24) / (1000 * 3600)).toString().padStart(2, "0"));
    		}

    		if ($$self.$$.dirty & /*diff*/ 256) {
    			 $$invalidate(2, minutes = Math.floor(diff % (1000 * 3600) / (1000 * 60)).toString().padStart(2, "0"));
    		}

    		if ($$self.$$.dirty & /*diff*/ 256) {
    			 $$invalidate(3, seconds = Math.floor(diff % (1000 * 60) / 1000).toString().padStart(2, "0"));
    		}
    	};

    	return [days, hours, minutes, seconds, onDragStart, onDrag, onDragEnd];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
